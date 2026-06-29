'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import {
  buildOrchestratorAgentExecution,
  executeOrchestratorRuntimeAgent,
} from '@/services/runtime/runtime-orchestrator-execution';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { isHomeGoalId } from '@/utils/home/goal-handoff';
import { ensureGoalProject } from '@/utils/projects/goal-project';
import {
  buildFindClientsAgentPayload,
  resolveFindClientsResultText,
  shouldExecuteFindClientsWithRuntime,
} from '@/utils/osa/find-clients-execution';
import { isRuntimeBridgeEnabledForGoal } from '@/utils/osa/runtime-bridge-policy';
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
import {
  buildOsaExecutionPlanCreatedEvent,
  buildOsaExecutionControlEvent,
  buildOsaProgressUpdatedEvent,
  buildOsaRunInsertRecord,
  buildOsaRunInputPayload,
  buildOsaRunUpdateForFindClientsResult,
  buildOsaRuntimeCompletedEvent,
  buildOsaRuntimeFailedEvent,
  buildOsaRuntimeStartedEvent,
  buildOsaTaskSubmittedEvent,
  buildOsaTeamSelectedEvent,
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
import { extractRuntimeOutputText } from '@/utils/osa/runtime-output';
import {
  createExecutionCoordinatorFromSubmit,
  parseExecutionSession,
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
    const goalId = input.goalId ?? null;
    let projectId = input.projectId ?? null;

    if (goalId && isHomeGoalId(goalId)) {
      const ensuredProjectId = await ensureGoalProject(supabase, organizationId, userId, goalId);

      if (ensuredProjectId) {
        projectId = ensuredProjectId;
      }
    }

    const runtimeBridgeEnabled = isRuntimeBridgeEnabledForGoal(goalId);
    const preparedInput = prepareOsaTaskSubmitInput({
      ...input,
      projectId,
      goalId,
    });
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

function readGoalIdFromRunInput(inputRecord: Record<string, unknown>): string | null {
  const goalId = inputRecord.goal_id ?? inputRecord.goalId;

  return typeof goalId === 'string' && goalId.trim().length > 0 ? goalId.trim() : null;
}

async function executeFindClientsTaskRun(input: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  aiEmployeeId: string;
  userId: string;
  run: { id: string; input: Record<string, unknown> };
  preparedInput: ReturnType<typeof prepareOsaTaskSubmitInput>;
  sessionId: string;
  inputRecord: Record<string, unknown>;
}): Promise<OsaTaskSubmitResult> {
  const { supabase, organizationId, aiEmployeeId, run, preparedInput, sessionId, inputRecord } =
    input;
  const context: OsaRunPersistenceContext = {
    runId: run.id,
    sessionId,
    organizationId,
    aiEmployeeId,
    userId: input.userId,
    runtimeBridgeEnabled: shouldExecuteFindClientsWithRuntime('find_clients'),
  };

  const useRuntime = shouldExecuteFindClientsWithRuntime('find_clients');
  let runtimeOutput: string | null = null;
  let runtimeReport: OsaTaskSubmitResult['runtimeReport'] = null;

  if (useRuntime) {
    const execution = buildOrchestratorAgentExecution({
      organizationId,
      employeeId: aiEmployeeId,
      runId: run.id,
      action: 'find_clients_result',
      payload: buildFindClientsAgentPayload(preparedInput, sessionId, run.id),
    });

    const runtimeResult = await executeOrchestratorRuntimeAgent(execution);

    if (runtimeResult.success) {
      runtimeOutput = extractRuntimeOutputText(runtimeResult.result?.output);
    }

    if (runtimeResult.report) {
      runtimeReport = {
        runId: run.id,
        durationMs: runtimeResult.report.durationMs,
        toolCallCount: runtimeResult.report.toolCallCount,
        gatewayCallCount: runtimeResult.report.gatewayCallCount,
        inputTokens: runtimeResult.report.inputTokens,
        outputTokens: runtimeResult.report.outputTokens,
      };
    }
  }

  const { deliverable, resultText, usedRuntime } = resolveFindClientsResultText(
    preparedInput,
    runtimeOutput,
  );
  const agentTrace = buildOsaAgentTrace(preparedInput.selectedAgents);
  const update = buildOsaRunUpdateForFindClientsResult(
    preparedInput,
    context,
    resultText,
    deliverable.keyOutcome,
    usedRuntime,
    runtimeReport
      ? {
          runId: runtimeReport.runId,
          durationMs: runtimeReport.durationMs,
          toolCallCount: runtimeReport.toolCallCount,
          gatewayCallCount: runtimeReport.gatewayCallCount,
          inputTokens: runtimeReport.inputTokens,
          outputTokens: runtimeReport.outputTokens,
        }
      : null,
  );

  await supabase
    .from('agent_runs')
    .update({
      ...update,
      input: {
        ...inputRecord,
        ...buildOsaRunInputPayload(preparedInput, context),
      },
    })
    .eq('id', run.id);

  await createOsaEvent(
    supabase,
    buildOsaRuntimeCompletedEvent(context, {
      session_id: sessionId,
      status: 'completed',
      result_text: resultText,
      agent_trace: agentTrace,
      goal_id: 'find_clients',
      key_outcome: deliverable.keyOutcome,
    }),
  );

  revalidateOsaRunPaths(run.id, aiEmployeeId);
  revalidatePath('/home');
  revalidatePath('/projects');

  return {
    status: 'completed',
    message: 'Your client acquisition plan is ready.',
    resultText,
    agentTrace,
    runtimeReport,
  };
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
        message: 'Run not found',
        resultText: null,
        agentTrace: [],
        runtimeReport: null,
      };
    }

    if (run.status !== 'running') {
      return {
        status: 'failed',
        message: 'This run has already finished',
        resultText: null,
        agentTrace: [],
        runtimeReport: null,
      };
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
      goalId: readGoalIdFromRunInput(inputRecord),
      goalTitle:
        typeof inputRecord.goal_title === 'string' ? inputRecord.goal_title : null,
      projectId:
        typeof inputRecord.project_id === 'string' ? inputRecord.project_id : null,
    });
    const goalId = readGoalIdFromRunInput(inputRecord);

    if (goalId === 'find_clients') {
      return executeFindClientsTaskRun({
        supabase,
        organizationId,
        aiEmployeeId,
        userId: auth.userId,
        run: { id: run.id, input: inputRecord },
        preparedInput,
        sessionId,
        inputRecord,
      });
    }

    const failureMessage =
      'Only Find Clients is available right now. Go back to Today and choose Find more clients.';
    const context: OsaRunPersistenceContext = {
      runId: run.id,
      sessionId,
      organizationId,
      aiEmployeeId,
      userId: auth.userId,
      runtimeBridgeEnabled: false,
    };

    await supabase
      .from('agent_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: failureMessage,
        output: {
          status: 'failed',
          message: failureMessage,
          session_id: sessionId,
        },
      })
      .eq('id', run.id);
    await createOsaEvent(
      supabase,
      buildOsaRuntimeFailedEvent(context, {
        session_id: sessionId,
        status: 'failed',
        error: { message: failureMessage },
      }),
    );
    revalidateOsaRunPaths(run.id, aiEmployeeId);

    return {
      status: 'failed',
      message: failureMessage,
      resultText: null,
      agentTrace: buildOsaAgentTrace(preparedInput.selectedAgents),
      runtimeReport: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not complete the task';

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
  revalidatePath('/history');
  revalidatePath('/results');
  revalidatePath(`/results/${runId}`);
  revalidatePath('/orchestrator');
  revalidatePath('/orchestrator/runs');
  revalidatePath(`/orchestrator/runs/${runId}`);
  revalidatePath('/ai-employees');
  revalidatePath(`/ai-employees/${aiEmployeeId}`);
}
