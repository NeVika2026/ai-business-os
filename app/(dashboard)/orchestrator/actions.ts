'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  buildOrchestratorAgentExecution,
  executeOrchestratorRuntimeAgent,
  isRuntimeBridgeEnabled,
} from '@/services/runtime/runtime-orchestrator-execution';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

function getOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function createRunEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    organizationId: string;
    type: string;
    actorType: string;
    actorId: string | null;
    runId: string;
    aiEmployeeId: string;
    payload?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from('events').insert({
    organization_id: params.organizationId,
    type: params.type,
    source: 'orchestrator',
    actor_type: params.actorType,
    actor_id: params.actorId,
    payload: {
      run_id: params.runId,
      ai_employee_id: params.aiEmployeeId,
      ...params.payload,
    },
    correlation_id: params.runId,
  });

  if (error) {
    throw error;
  }
}

export async function executeAgent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const aiEmployeeId = getOptionalText(formData.get('ai_employee_id'));

  if (!aiEmployeeId) {
    throw new Error('AI employee id is required');
  }

  const { data: employee, error: employeeError } = await supabase
    .from('ai_employees')
    .select('id, name, status, is_active')
    .eq('id', aiEmployeeId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (employeeError) {
    throw employeeError;
  }

  if (!employee) {
    throw new Error('AI employee not found');
  }

  const startedAt = new Date().toISOString();
  const runtimeBridgeEnabled = isRuntimeBridgeEnabled();

  const { data: run, error: runError } = await supabase
    .from('agent_runs')
    .insert({
      organization_id: organizationId,
      ai_employee_id: aiEmployeeId,
      status: 'running',
      input: {
        action: 'execute',
        simulated: !runtimeBridgeEnabled,
        runtime_bridge_enabled: runtimeBridgeEnabled,
        employee_name: employee.name,
      },
      started_at: startedAt,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (runError) {
    throw runError;
  }

  const { data: startedEvent, error: startedEventError } = await supabase
    .from('events')
    .insert({
      organization_id: organizationId,
      type: 'run_started',
      source: 'orchestrator',
      actor_type: 'user',
      actor_id: user.id,
      payload: {
        run_id: run.id,
        ai_employee_id: aiEmployeeId,
      },
      correlation_id: run.id,
    })
    .select('id')
    .single();

  if (startedEventError) {
    throw startedEventError;
  }

  await supabase.from('agent_runs').update({ event_id: startedEvent.id }).eq('id', run.id);

  const canExecute = employee.status === 'active' && employee.is_active;

  if (!canExecute) {
    const completedAt = new Date().toISOString();
    const errorMessage = 'AI employee is inactive';

    await supabase
      .from('agent_runs')
      .update({
        status: 'failed',
        completed_at: completedAt,
        error_message: errorMessage,
      })
      .eq('id', run.id);

    await createRunEvent(supabase, {
      organizationId,
      type: 'run_failed',
      actorType: 'system',
      actorId: null,
      runId: run.id,
      aiEmployeeId,
      payload: { error: errorMessage },
    });
  } else if (runtimeBridgeEnabled) {
    const execution = buildOrchestratorAgentExecution({
      organizationId,
      employeeId: aiEmployeeId,
      runId: run.id,
      action: 'execute',
    });
    const runtimeResult = await executeOrchestratorRuntimeAgent(execution);
    const completedAt = new Date().toISOString();

    if (!runtimeResult.success) {
      const errorMessage = runtimeResult.error?.message ?? 'Runtime execution failed';

      await supabase
        .from('agent_runs')
        .update({
          status: 'failed',
          completed_at: completedAt,
          error_message: errorMessage,
          output: {
            simulated: false,
            runtime_bridge_enabled: true,
            status: runtimeResult.status,
            error: runtimeResult.error,
          },
        })
        .eq('id', run.id);

      await createRunEvent(supabase, {
        organizationId,
        type: 'run_failed',
        actorType: 'system',
        actorId: null,
        runId: run.id,
        aiEmployeeId,
        payload: {
          error: errorMessage,
          runtime_bridge_enabled: true,
        },
      });
    } else {
      await supabase
        .from('agent_runs')
        .update({
          status: 'completed',
          completed_at: completedAt,
          output: {
            simulated: false,
            runtime_bridge_enabled: true,
            status: runtimeResult.status,
            report: runtimeResult.report,
            result_status: runtimeResult.result?.status ?? null,
          },
          tokens_input: runtimeResult.report?.inputTokens ?? 0,
          tokens_output: runtimeResult.report?.outputTokens ?? 0,
        })
        .eq('id', run.id);

      await createRunEvent(supabase, {
        organizationId,
        type: 'run_completed',
        actorType: 'ai_employee',
        actorId: aiEmployeeId,
        runId: run.id,
        aiEmployeeId,
        payload: {
          runtime_bridge_enabled: true,
          status: runtimeResult.status,
        },
      });
    }
  } else {
    const completedAt = new Date().toISOString();

    await supabase
      .from('agent_runs')
      .update({
        status: 'completed',
        completed_at: completedAt,
        output: {
          simulated: true,
          runtime_bridge_enabled: false,
          message: `Pipeline completed for ${employee.name}`,
          steps: ['load_context', 'plan', 'execute', 'finalize'],
        },
        tokens_input: 120,
        tokens_output: 85,
      })
      .eq('id', run.id);

    await createRunEvent(supabase, {
      organizationId,
      type: 'run_completed',
      actorType: 'ai_employee',
      actorId: aiEmployeeId,
      runId: run.id,
      aiEmployeeId,
    });
  }

  revalidatePath('/history');
  revalidatePath('/results');
  revalidatePath(`/results/${run.id}`);
  revalidatePath('/orchestrator');
  revalidatePath('/orchestrator/runs');
  revalidatePath(`/orchestrator/runs/${run.id}`);
  revalidatePath('/ai-employees');
  revalidatePath(`/ai-employees/${aiEmployeeId}`);

  redirect(`/results/${run.id}`);
}
