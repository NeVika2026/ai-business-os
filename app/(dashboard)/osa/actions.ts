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
import { resolveOsaCoordinatorEmployeeId } from '@/utils/osa/osa-coordinator';
import {
  buildOsaExecutionGraph,
  buildOsaRuntimeInputFromTaskCall,
} from '@/utils/osa/osa-runtime-context';
import {
  buildOsaExecutionPlanCreatedEvent,
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
  prepareOsaTaskSubmitInput,
  validateOsaTaskInput,
  type OsaTaskSubmitInput,
  type OsaTaskSubmitResult,
} from '@/utils/osa/osa-task';
import {
  createExecutionCoordinatorFromSubmit,
  runTeamRuntimeExecution,
  serializeExecutionSession,
} from '@/utils/osa/team-runtime';

async function createOsaEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  event: OsaEventInsertRecord,
) {
  const { error } = await supabase.from('events').insert(event);

  if (error) {
    throw error;
  }
}

export async function submitOsaTask(input: OsaTaskSubmitInput): Promise<OsaTaskSubmitResult> {
  const validationError = validateOsaTaskInput(input);

  if (validationError) {
    return {
      status: 'failed',
      message: validationError,
      resultText: null,
      agentTrace: [],
      runtimeReport: null,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        status: 'failed',
        message: 'Требуется авторизация',
        resultText: null,
        agentTrace: [],
        runtimeReport: null,
      };
    }

    const organizationId = await getCurrentOrganizationId(supabase);

    if (!organizationId) {
      return {
        status: 'failed',
        message: 'Организация не найдена',
        resultText: null,
        agentTrace: [],
        runtimeReport: null,
      };
    }

    const aiEmployeeId = await resolveOsaCoordinatorEmployeeId(supabase, organizationId);

    if (!aiEmployeeId) {
      return {
        status: 'failed',
        message: 'OSA Navigator не настроен для организации',
        resultText: null,
        agentTrace: [],
        runtimeReport: null,
      };
    }

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
            userId: user.id,
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
      userId: user.id,
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

    if (!runtimeBridgeEnabled) {
      const coordinator = await runTeamRuntimeExecution(
        initialCoordinator,
        { sessionId, runId: run.id, source: 'osa_workspace' },
        async (call) => ({
          summary: `Simulated ${call.taskId}`,
          output: `Demo output for ${call.stageId}`,
        }),
      );

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

        return extractTeamRuntimeTaskResult(runtimeResult);
      },
    );

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
    const message = error instanceof Error ? error.message : 'Не удалось отправить задачу';

    return {
      status: 'failed',
      message,
      resultText: null,
      agentTrace: [],
      runtimeReport: null,
    };
  }
}

function revalidateOsaRunPaths(runId: string, aiEmployeeId: string) {
  revalidatePath('/osa');
  revalidatePath('/orchestrator');
  revalidatePath('/orchestrator/runs');
  revalidatePath(`/orchestrator/runs/${runId}`);
  revalidatePath('/ai-employees');
  revalidatePath(`/ai-employees/${aiEmployeeId}`);
}

function extractTeamRuntimeTaskResult(
  runtime: Awaited<ReturnType<typeof executeOrchestratorRuntimeAgent>>,
): { summary: string; output: string } {
  const output = runtime.result?.output;

  if (output && typeof output === 'object') {
    for (const key of ['content', 'summary', 'message'] as const) {
      const value = output[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        const text = value.trim();
        return { summary: text, output: text };
      }
    }
  }

  return {
    summary: 'Task completed via RuntimeBridge',
    output: 'Task completed via RuntimeBridge',
  };
}
