'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import {
  buildOrchestratorAgentExecution,
  executeOrchestratorRuntimeAgent,
  isRuntimeBridgeEnabled,
} from '@/services/runtime/runtime-orchestrator-execution';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import {
  applyExecutionControl,
  canControlExecution,
  type ExecutionControlAction,
} from '@/utils/osa/execution-controls';
import {
  buildExecutionProgress,
  parseExecutionProgress,
  type ExecutionProgress,
} from '@/utils/osa/execution-progress';
import { resolveOsaCoordinatorEmployeeId } from '@/utils/osa/osa-coordinator';
import { buildOsaRuntimeInputFromTaskCall } from '@/utils/osa/osa-runtime-context';
import {
  buildOsaExecutionPlanCreatedEvent,
  buildOsaExecutionControlEvent,
  buildOsaProgressUpdatedEvent,
  buildOsaRunInsertRecord,
  buildOsaRunInputPayload,
  buildOsaRunUpdateForRuntimeFailure,
  buildOsaRunUpdateForRuntimeSuccess,
  buildOsaRunUpdateForSimulated,
  buildOsaRuntimeCompletedEvent,
  buildOsaRuntimeFailedEvent,
  buildOsaRuntimeStartedEvent,
  buildOsaTaskSubmittedEvent,
  buildOsaTeamSelectedEvent,
  buildPersistedRuntimeOsaTaskResult,
  buildPersistedSimulatedOsaTaskResult,
  type OsaEventInsertRecord,
  type OsaRunPersistenceContext,
} from '@/utils/osa/osa-run-persistence';
import {
  buildOsaAgentTrace,
  buildOsaExecutionGraph,
  prepareOsaTaskSubmitInput,
  validateOsaTaskInput,
  type OsaTaskSubmitInput,
  type OsaTaskSubmitResult,
} from '@/utils/osa/osa-task';
import { extractRuntimeTaskResult } from '@/utils/osa/runtime-output';
import {
  createExecutionCoordinatorFromSubmit,
  parseExecutionSession,
  runTeamRuntimeExecution,
  serializeExecutionSession,
  type ExecutionCoordinator,
} from '@/utils/osa/team-runtime';

export type OsaTaskStartResult =
  | {
      status: 'started';
      runId: string;
      sessionId: string;
    }
  | {
      status: 'failed';
      message: string;
    };

async function createOsaEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  event: OsaEventInsertRecord,
) {
  const { error } = await supabase.from('events').insert(event);

  if (error) {
    throw error;
  }
}

export type OsaExecutionControlResult =
  | {
      status: 'ok';
      progress: ExecutionProgress;
    }
  | {
      status: 'failed';
      message: string;
    };

async function persistExecutionSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  runId: string,
  organizationId: string,
  inputRecord: Record<string, unknown>,
  coordinator: ExecutionCoordinator,
) {
  const { error } = await supabase
    .from('agent_runs')
    .update({
      input: {
        ...inputRecord,
        execution_session: serializeExecutionSession(coordinator.session),
      },
    })
    .eq('id', runId)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }
}

async function persistOsaProgressUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  context: OsaRunPersistenceContext,
  coordinator: ExecutionCoordinator,
  inputRecord?: Record<string, unknown>,
) {
  const progress = buildExecutionProgress(coordinator.session);
  await createOsaEvent(supabase, buildOsaProgressUpdatedEvent(context, progress));

  if (inputRecord) {
    await persistExecutionSession(
      supabase,
      context.runId,
      context.organizationId,
      inputRecord,
      coordinator,
    );
  }
}

function createProgressHook(
  supabase: Awaited<ReturnType<typeof createClient>>,
  context: OsaRunPersistenceContext,
  inputRecord: Record<string, unknown>,
) {
  return async (coordinator: ExecutionCoordinator) => {
    await persistOsaProgressUpdate(supabase, context, coordinator, inputRecord);
  };
}

function createControlCheckHook(
  supabase: Awaited<ReturnType<typeof createClient>>,
  runId: string,
  organizationId: string,
  fallback: ExecutionCoordinator,
): (coordinator: ExecutionCoordinator) => Promise<ExecutionCoordinator> {
  return async (coordinator) => {
    const { data: run, error } = await supabase
      .from('agent_runs')
      .select('input')
      .eq('id', runId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !run) {
      return coordinator;
    }

    const session = parseExecutionSession(
      (run.input as Record<string, unknown>).execution_session ?? null,
    );

    return session ? { session } : fallback;
  };
}

function resolveCoordinatorFromRunInput(
  inputRecord: Record<string, unknown>,
  preparedInput: ReturnType<typeof prepareOsaTaskSubmitInput>,
  sessionId: string,
): ExecutionCoordinator {
  const persisted = parseExecutionSession(inputRecord.execution_session);

  if (persisted) {
    return { session: persisted };
  }

  const executionGraph = buildOsaExecutionGraph(preparedInput, `osa-graph-${sessionId}`);

  return createExecutionCoordinatorFromSubmit(preparedInput, executionGraph, sessionId);
}

async function resolveOsaAuthContext(): Promise<
  | {
      supabase: Awaited<ReturnType<typeof createClient>>;
      organizationId: string;
      userId: string;
      aiEmployeeId: string;
    }
  | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Требуется авторизация' };
  }

  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return { error: 'Организация не найдена' };
  }

  const aiEmployeeId = await resolveOsaCoordinatorEmployeeId(supabase, organizationId);

  if (!aiEmployeeId) {
    return { error: 'OSA Navigator не настроен для организации' };
  }

  return { supabase, organizationId, userId: user.id, aiEmployeeId };
}

export async function startOsaTask(input: OsaTaskSubmitInput): Promise<OsaTaskStartResult> {
  const validationError = validateOsaTaskInput(input);

  if (validationError) {
    return { status: 'failed', message: validationError };
  }

  try {
    const auth = await resolveOsaAuthContext();

    if ('error' in auth) {
      return { status: 'failed', message: auth.error };
    }

    const { supabase, organizationId, userId, aiEmployeeId } = auth;
    const sessionId = input.sessionId?.trim() || randomUUID();
    const runtimeBridgeEnabled = isRuntimeBridgeEnabled();
    const preparedInput = prepareOsaTaskSubmitInput(input);
    const executionGraph = buildOsaExecutionGraph(preparedInput, `osa-graph-${sessionId}`);
    const initialCoordinator = createExecutionCoordinatorFromSubmit(
      preparedInput,
      executionGraph,
      sessionId,
    );

    const { data: run, error: runError } = await supabase
      .from('agent_runs')
      .insert(
        buildOsaRunInsertRecord(
          preparedInput,
          {
            runId: '',
            sessionId,
            organizationId,
            aiEmployeeId,
            userId,
            runtimeBridgeEnabled,
          },
          initialCoordinator.session,
        ),
      )
      .select('id')
      .single();

    if (runError) {
      throw runError;
    }

    const context: OsaRunPersistenceContext = {
      runId: run.id,
      sessionId,
      organizationId,
      aiEmployeeId,
      userId,
      runtimeBridgeEnabled,
    };

    const submittedEvent = buildOsaTaskSubmittedEvent(context);
    const { data: submittedEventRow, error: submittedEventError } = await supabase
      .from('events')
      .insert(submittedEvent)
      .select('id')
      .single();

    if (submittedEventError) {
      throw submittedEventError;
    }

    await supabase.from('agent_runs').update({ event_id: submittedEventRow.id }).eq('id', run.id);

    await createOsaEvent(
      supabase,
      buildOsaTeamSelectedEvent(context, preparedInput.selectedAgents),
    );
    await createOsaEvent(
      supabase,
      buildOsaExecutionPlanCreatedEvent(context, preparedInput.executionPlan),
    );
    await createOsaEvent(supabase, buildOsaRuntimeStartedEvent(context));
    await persistOsaProgressUpdate(supabase, context, initialCoordinator);

    revalidateOsaRunPaths(run.id, aiEmployeeId);
    return { status: 'started', runId: run.id, sessionId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось запустить задачу';
    return { status: 'failed', message };
  }
}

export async function getOsaRunProgress(runId: string): Promise<ExecutionProgress | null> {
  if (!runId.trim()) {
    return null;
  }

  try {
    const auth = await resolveOsaAuthContext();

    if ('error' in auth) {
      return null;
    }

    const { supabase, organizationId } = auth;
    const { data: events, error } = await supabase
      .from('events')
      .select('payload, type, created_at')
      .eq('organization_id', organizationId)
      .eq('correlation_id', runId)
      .eq('type', 'osa_progress_updated')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const latest = events?.[0];

    if (!latest) {
      return null;
    }

    return parseExecutionProgress(latest.payload);
  } catch {
    return null;
  }
}

export async function controlOsaExecution(
  runId: string,
  action: ExecutionControlAction,
  options?: { taskId?: string; stageId?: string },
): Promise<OsaExecutionControlResult> {
  if (!runId.trim()) {
    return { status: 'failed', message: 'runId is required' };
  }

  try {
    const auth = await resolveOsaAuthContext();

    if ('error' in auth) {
      return { status: 'failed', message: auth.error };
    }

    const { supabase, organizationId, userId, aiEmployeeId } = auth;
    const { data: run, error: runError } = await supabase
      .from('agent_runs')
      .select('id, input, status, created_by')
      .eq('id', runId)
      .eq('organization_id', organizationId)
      .single();

    if (runError || !run) {
      return { status: 'failed', message: 'Запуск не найден' };
    }

    const inputRecord = run.input as Record<string, unknown>;
    const sessionId =
      typeof inputRecord.session_id === 'string' ? inputRecord.session_id : randomUUID();
    const preparedInput = prepareOsaTaskSubmitInput({
      userPrompt: String(inputRecord.user_prompt ?? ''),
      businessDescription: String(inputRecord.business_description ?? ''),
      selectedAgents: Array.isArray(inputRecord.selected_agents)
        ? (inputRecord.selected_agents as OsaTaskSubmitInput['selectedAgents'])
        : [],
      sessionId,
      executionPlan: inputRecord.execution_plan as OsaTaskSubmitInput['executionPlan'],
    });
    const coordinator = resolveCoordinatorFromRunInput(inputRecord, preparedInput, sessionId);
    const runOwnerId = typeof run.created_by === 'string' ? run.created_by : userId;
    const runStatus = run.status as 'running' | 'completed' | 'failed' | 'cancelled';

    if (!canControlExecution({ userId, runOwnerId, runStatus }, coordinator, action)) {
      return { status: 'failed', message: 'Действие недоступно для текущего состояния' };
    }

    const executionGraph = buildOsaExecutionGraph(preparedInput, `osa-graph-${sessionId}`);
    const previousState = coordinator.session.state;
    const nextCoordinator = applyExecutionControl(coordinator, action, {
      taskId: options?.taskId,
      stageId: options?.stageId,
      initialGraph: executionGraph,
    });

    if (nextCoordinator.session.state === previousState && action !== 'restart') {
      return { status: 'failed', message: 'Не удалось применить действие' };
    }

    const context: OsaRunPersistenceContext = {
      runId: run.id,
      sessionId,
      organizationId,
      aiEmployeeId,
      userId,
      runtimeBridgeEnabled: inputRecord.runtime_bridge_enabled === true,
    };

    await persistExecutionSession(supabase, run.id, organizationId, inputRecord, nextCoordinator);

    await createOsaEvent(
      supabase,
      buildOsaExecutionControlEvent(context, action, {
        task_id: options?.taskId ?? null,
        stage_id: options?.stageId ?? null,
        control_state: nextCoordinator.session.state,
      }),
    );

    const progress = buildExecutionProgress(nextCoordinator.session);
    await createOsaEvent(supabase, buildOsaProgressUpdatedEvent(context, progress));

    const runUpdate: Record<string, unknown> = {};

    if (action === 'cancel') {
      runUpdate.status = 'cancelled';
      runUpdate.completed_at = new Date().toISOString();
      runUpdate.error_message = 'Execution cancelled by user';
    } else if (action === 'restart') {
      runUpdate.status = 'running';
      runUpdate.completed_at = null;
      runUpdate.error_message = null;
    }

    if (Object.keys(runUpdate).length > 0) {
      await supabase.from('agent_runs').update(runUpdate).eq('id', run.id);
    }

    revalidateOsaRunPaths(run.id, aiEmployeeId);
    return { status: 'ok', progress };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось выполнить действие';
    return { status: 'failed', message };
  }
}

export async function executeOsaTaskRun(runId: string): Promise<OsaTaskSubmitResult> {
  if (!runId.trim()) {
    return {
      status: 'failed',
      message: 'runId is required',
      resultText: null,
      agentTrace: [],
      runtimeReport: null,
    };
  }

  try {
    const auth = await resolveOsaAuthContext();

    if ('error' in auth) {
      return {
        status: 'failed',
        message: auth.error,
        resultText: null,
        agentTrace: [],
        runtimeReport: null,
      };
    }

    const { supabase, organizationId, aiEmployeeId } = auth;
    const { data: run, error: runError } = await supabase
      .from('agent_runs')
      .select('id, input, status')
      .eq('id', runId)
      .eq('organization_id', organizationId)
      .single();

    if (runError || !run) {
      return {
        status: 'failed',
        message: 'Запуск не найден',
        resultText: null,
        agentTrace: [],
        runtimeReport: null,
      };
    }

    if (run.status !== 'running') {
      return {
        status: 'failed',
        message: 'Запуск уже завершён',
        resultText: null,
        agentTrace: [],
        runtimeReport: null,
      };
    }

    const inputRecord = run.input as Record<string, unknown>;
    const sessionId =
      typeof inputRecord.session_id === 'string' ? inputRecord.session_id : randomUUID();
    const runtimeBridgeEnabled = inputRecord.runtime_bridge_enabled === true;
    const preparedInput = prepareOsaTaskSubmitInput({
      userPrompt: String(inputRecord.user_prompt ?? ''),
      businessDescription: String(inputRecord.business_description ?? ''),
      selectedAgents: Array.isArray(inputRecord.selected_agents)
        ? (inputRecord.selected_agents as OsaTaskSubmitInput['selectedAgents'])
        : [],
      sessionId,
      executionPlan: inputRecord.execution_plan as OsaTaskSubmitInput['executionPlan'],
    });
    const initialCoordinator = resolveCoordinatorFromRunInput(
      inputRecord,
      preparedInput,
      sessionId,
    );

    const context: OsaRunPersistenceContext = {
      runId: run.id,
      sessionId,
      organizationId,
      aiEmployeeId,
      userId: auth.userId,
      runtimeBridgeEnabled,
    };

    const onProgress = createProgressHook(supabase, context, inputRecord);
    const onControlCheck = createControlCheckHook(
      supabase,
      run.id,
      organizationId,
      initialCoordinator,
    );

    if (!runtimeBridgeEnabled) {
      const coordinator = await runTeamRuntimeExecution(
        initialCoordinator,
        { sessionId, runId: run.id, source: 'osa_workspace' },
        async (call) => ({
          summary: `Simulated ${call.taskId}`,
          output: `Demo output for ${call.stageId}`,
        }),
        async (nextCoordinator) => onProgress(nextCoordinator),
        onControlCheck,
      );

      if (coordinator.session.state === 'cancelled') {
        revalidateOsaRunPaths(run.id, aiEmployeeId);
        return {
          status: 'failed',
          message: 'Выполнение отменено',
          resultText: null,
          agentTrace: buildOsaAgentTrace(preparedInput.selectedAgents),
          runtimeReport: {
            runId: run.id,
            durationMs: null,
            toolCallCount: 0,
            gatewayCallCount: 0,
            inputTokens: 0,
            outputTokens: 0,
          },
        };
      }

      const update = buildOsaRunUpdateForSimulated(preparedInput, context, coordinator);
      const result = buildPersistedSimulatedOsaTaskResult(preparedInput, sessionId, run.id);

      await supabase
        .from('agent_runs')
        .update({
          ...update,
          input: buildOsaRunInputPayload(preparedInput, context, coordinator.session),
        })
        .eq('id', run.id);
      await createOsaEvent(
        supabase,
        buildOsaRuntimeCompletedEvent(context, {
          session_id: sessionId,
          status: 'simulated',
          result_text: result.resultText,
          agent_trace: result.agentTrace,
          execution_session: serializeExecutionSession(coordinator.session),
        }),
      );

      revalidateOsaRunPaths(run.id, aiEmployeeId);
      return result;
    }

    const runtimeTotals = {
      inputTokens: 0,
      outputTokens: 0,
      toolCallCount: 0,
      gatewayCallCount: 0,
      durationMs: 0,
    };

    const coordinator = await runTeamRuntimeExecution(
      initialCoordinator,
      { sessionId, runId: run.id, source: 'osa_workspace' },
      async (call) => {
        const execution = buildOrchestratorAgentExecution({
          organizationId,
          employeeId: aiEmployeeId,
          runId: run.id,
          action: 'osa_task',
          payload: buildOsaRuntimeInputFromTaskCall(preparedInput, call.payload, {
            sessionId,
            source: 'osa_workspace',
          }),
        });

        const runtimeResult = await executeOrchestratorRuntimeAgent(execution);

        if (runtimeResult.report) {
          runtimeTotals.inputTokens += runtimeResult.report.inputTokens;
          runtimeTotals.outputTokens += runtimeResult.report.outputTokens;
          runtimeTotals.toolCallCount += runtimeResult.report.toolCallCount;
          runtimeTotals.gatewayCallCount += runtimeResult.report.gatewayCallCount;
          runtimeTotals.durationMs += runtimeResult.report.durationMs ?? 0;
        }

        if (!runtimeResult.success) {
          return { error: runtimeResult.error?.message ?? 'Runtime execution failed' };
        }

        return extractRuntimeTaskResult(runtimeResult.result?.output);
      },
      async (nextCoordinator) => onProgress(nextCoordinator),
      onControlCheck,
    );

    if (coordinator.session.state === 'cancelled') {
      revalidateOsaRunPaths(run.id, aiEmployeeId);
      return {
        status: 'failed',
        message: 'Выполнение отменено',
        resultText: null,
        agentTrace: buildOsaAgentTrace(preparedInput.selectedAgents),
        runtimeReport: {
          runId: run.id,
          durationMs: runtimeTotals.durationMs || null,
          toolCallCount: runtimeTotals.toolCallCount,
          gatewayCallCount: runtimeTotals.gatewayCallCount,
          inputTokens: runtimeTotals.inputTokens,
          outputTokens: runtimeTotals.outputTokens,
        },
      };
    }

    const aggregatedRuntimeResult = {
      success: coordinator.session.state === 'completed',
      status:
        coordinator.session.state === 'completed' ? ('completed' as const) : ('failed' as const),
      simulated: false,
      result: null,
      error:
        coordinator.session.state === 'failed'
          ? {
              code: 'TeamRuntimeError',
              message: coordinator.session.failedTasks.join(', ') || 'Team runtime failed',
              stage: coordinator.session.currentStage,
            }
          : null,
      report: {
        runId: run.id,
        durationMs: runtimeTotals.durationMs || null,
        toolCallCount: runtimeTotals.toolCallCount,
        gatewayCallCount: runtimeTotals.gatewayCallCount,
        inputTokens: runtimeTotals.inputTokens,
        outputTokens: runtimeTotals.outputTokens,
      },
    };

    const result = buildPersistedRuntimeOsaTaskResult(
      preparedInput,
      aggregatedRuntimeResult,
      run.id,
    );

    if (!aggregatedRuntimeResult.success) {
      const update = buildOsaRunUpdateForRuntimeFailure(
        aggregatedRuntimeResult,
        preparedInput,
        context,
        coordinator,
      );

      await supabase
        .from('agent_runs')
        .update({
          ...update,
          input: buildOsaRunInputPayload(preparedInput, context, coordinator.session),
        })
        .eq('id', run.id);
      await createOsaEvent(
        supabase,
        buildOsaRuntimeFailedEvent(context, {
          session_id: sessionId,
          status: aggregatedRuntimeResult.status,
          error: aggregatedRuntimeResult.error,
          result_text: result.resultText,
          agent_trace: result.agentTrace,
          execution_session: serializeExecutionSession(coordinator.session),
        }),
      );

      revalidateOsaRunPaths(run.id, aiEmployeeId);
      return result;
    }

    const update = buildOsaRunUpdateForRuntimeSuccess(
      aggregatedRuntimeResult,
      preparedInput,
      context,
      coordinator,
    );

    await supabase
      .from('agent_runs')
      .update({
        ...update,
        input: buildOsaRunInputPayload(preparedInput, context, coordinator.session),
      })
      .eq('id', run.id);
    await createOsaEvent(
      supabase,
      buildOsaRuntimeCompletedEvent(context, {
        session_id: sessionId,
        status: aggregatedRuntimeResult.status,
        result_text: result.resultText,
        agent_trace: result.agentTrace,
        report: aggregatedRuntimeResult.report,
        execution_session: serializeExecutionSession(coordinator.session),
      }),
    );

    revalidateOsaRunPaths(run.id, aiEmployeeId);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось выполнить задачу';

    return {
      status: 'failed',
      message,
      resultText: null,
      agentTrace: [],
      runtimeReport: null,
    };
  }
}

export async function submitOsaTask(input: OsaTaskSubmitInput): Promise<OsaTaskSubmitResult> {
  const started = await startOsaTask(input);

  if (started.status === 'failed') {
    return {
      status: 'failed',
      message: started.message,
      resultText: null,
      agentTrace: [],
      runtimeReport: null,
    };
  }

  return executeOsaTaskRun(started.runId);
}

function revalidateOsaRunPaths(runId: string, aiEmployeeId: string) {
  revalidatePath('/osa');
  revalidatePath('/orchestrator');
  revalidatePath('/orchestrator/runs');
  revalidatePath(`/orchestrator/runs/${runId}`);
  revalidatePath('/ai-employees');
  revalidatePath(`/ai-employees/${aiEmployeeId}`);
}
