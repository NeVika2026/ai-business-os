'use server';

import { randomUUID } from 'node:crypto';

import {
  buildOrchestratorAgentExecution,
  executeOrchestratorRuntimeAgent,
  isRuntimeBridgeEnabled,
} from '@/services/runtime/runtime-orchestrator-execution';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import {
  buildSimulatedOsaTaskResult,
  mapRuntimeResultToOsaTaskResult,
  OSA_COORDINATOR_EMPLOYEE_ID,
  validateOsaTaskInput,
  type OsaTaskSubmitInput,
  type OsaTaskSubmitResult,
} from '@/utils/osa/osa-task';

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

    const sessionId = input.sessionId?.trim() || randomUUID();
    const runId = randomUUID();

    if (!isRuntimeBridgeEnabled()) {
      return buildSimulatedOsaTaskResult(input, sessionId);
    }

    const execution = buildOrchestratorAgentExecution({
      organizationId,
      employeeId: OSA_COORDINATOR_EMPLOYEE_ID,
      runId,
      action: 'osa_task',
      payload: {
        userPrompt: input.userPrompt.trim(),
        businessDescription: input.businessDescription.trim(),
        selectedAgents: input.selectedAgents,
        sessionId,
        source: 'osa_workspace',
      },
    });

    const runtimeResult = await executeOrchestratorRuntimeAgent(execution);
    return mapRuntimeResultToOsaTaskResult(input, runtimeResult);
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
