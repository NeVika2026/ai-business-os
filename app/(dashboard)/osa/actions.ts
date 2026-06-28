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
import { buildOsaRuntimeInput } from '@/utils/osa/osa-runtime-context';
import {
  buildOsaExecutionPlanCreatedEvent,
  buildOsaRunInsertRecord,
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

    const { data: run, error: runError } = await supabase
      .from('agent_runs')
      .insert(
        buildOsaRunInsertRecord(preparedInput, {
          runId: '',
          sessionId,
          organizationId,
          aiEmployeeId,
          userId: user.id,
          runtimeBridgeEnabled,
        }),
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
      const update = buildOsaRunUpdateForSimulated(preparedInput, context);
      const result = buildPersistedSimulatedOsaTaskResult(preparedInput, sessionId, run.id);

      await supabase.from('agent_runs').update(update).eq('id', run.id);
      await createOsaEvent(
        supabase,
        buildOsaRuntimeCompletedEvent(context, {
          session_id: sessionId,
          status: 'simulated',
          result_text: result.resultText,
          agent_trace: result.agentTrace,
        }),
      );

      revalidateOsaRunPaths(run.id, aiEmployeeId);
      return result;
    }

    const execution = buildOrchestratorAgentExecution({
      organizationId,
      employeeId: aiEmployeeId,
      runId: run.id,
      action: 'osa_task',
      payload: buildOsaRuntimeInput(preparedInput, {
        sessionId,
        source: 'osa_workspace',
      }),
    });

    const runtimeResult = await executeOrchestratorRuntimeAgent(execution);
    const result = buildPersistedRuntimeOsaTaskResult(preparedInput, runtimeResult, run.id);

    if (!runtimeResult.success) {
      const update = buildOsaRunUpdateForRuntimeFailure(runtimeResult, preparedInput, context);

      await supabase.from('agent_runs').update(update).eq('id', run.id);
      await createOsaEvent(
        supabase,
        buildOsaRuntimeFailedEvent(context, {
          session_id: sessionId,
          status: runtimeResult.status,
          error: runtimeResult.error,
          result_text: result.resultText,
          agent_trace: result.agentTrace,
        }),
      );

      revalidateOsaRunPaths(run.id, aiEmployeeId);
      return result;
    }

    const update = buildOsaRunUpdateForRuntimeSuccess(runtimeResult, preparedInput, context);

    await supabase.from('agent_runs').update(update).eq('id', run.id);
    await createOsaEvent(
      supabase,
      buildOsaRuntimeCompletedEvent(context, {
        session_id: sessionId,
        status: runtimeResult.status,
        result_text: result.resultText,
        agent_trace: result.agentTrace,
        report: runtimeResult.report,
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
