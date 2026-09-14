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

function getTaskText(value: FormDataEntryValue | null) {
  const task = getOptionalText(value);

  if (!task) {
    throw new Error('Task is required');
  }

  return task.slice(0, 4000);
}

const TASK_ROUTE_RULES = [
  {
    task: ['маркет', 'реклам', 'контент', 'smm', 'seo', 'лид', 'оффер', 'ворон'],
    employee: ['маркет', 'реклам', 'content', 'smm', 'seo', 'growth'],
  },
  {
    task: ['продаж', 'клиент', 'сделк', 'crm', 'ворон', 'лид'],
    employee: ['продаж', 'sales', 'crm', 'account'],
  },
  {
    task: ['финанс', 'бюджет', 'деньг', 'инвест', 'cash', 'profit', 'доход'],
    employee: ['финанс', 'finance', 'аналит', 'investment'],
  },
  {
    task: ['договор', 'юрист', 'право', 'закон', 'суд', 'документ'],
    employee: ['юрист', 'legal', 'прав', 'document'],
  },
  {
    task: ['автомат', 'процесс', 'операц', 'workflow', 'интеграц'],
    employee: ['автомат', 'операц', 'process', 'automation'],
  },
  {
    task: ['видео', 'ролик', 'сторис', 'пост', 'дизайн', 'визуал'],
    employee: ['контент', 'video', 'creative', 'design', 'маркет'],
  },
] as const;

function routeEmployee(
  task: string,
  employees: { id: string; name: string; role_title: string }[],
) {
  const normalizedTask = task.toLowerCase();

  const ranked = employees.map((employee, index) => {
    const employeeText = `${employee.name} ${employee.role_title}`.toLowerCase();
    let score = 0;

    for (const rule of TASK_ROUTE_RULES) {
      const taskMatch = rule.task.some((token) => normalizedTask.includes(token));

      if (!taskMatch) {
        continue;
      }

      score += rule.employee.some((token) => employeeText.includes(token)) ? 10 : 1;
    }

    for (const token of normalizedTask.split(/[^a-zа-яё0-9]+/i)) {
      if (token.length >= 5 && employeeText.includes(token)) {
        score += 3;
      }
    }

    return { employee, score, index };
  });

  ranked.sort((a, b) => b.score - a.score || a.index - b.index);
  return ranked[0]?.employee ?? null;
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

export async function dispatchTask(formData: FormData) {
  const task = getTaskText(formData.get('task'));
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

  const { data: employees, error } = await supabase
    .from('ai_employees')
    .select('id, name, role_title')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  const employee = routeEmployee(task, employees ?? []);

  if (!employee) {
    throw new Error('No active AI employees available');
  }

  const routedForm = new FormData();
  routedForm.set('ai_employee_id', employee.id);
  routedForm.set('task', task);
  routedForm.set('routing_mode', 'automatic');

  return executeAgent(routedForm);
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
  const task = getOptionalText(formData.get('task'));

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
        task,
        routing_mode: getOptionalText(formData.get('routing_mode')) ?? 'manual',
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
        task,
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
      payload: task ? { task } : undefined,
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
          task,
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

  revalidatePath('/orchestrator');
  revalidatePath('/orchestrator/runs');
  revalidatePath(`/orchestrator/runs/${run.id}`);
  revalidatePath('/ai-employees');
  revalidatePath(`/ai-employees/${aiEmployeeId}`);

  redirect(`/orchestrator/runs/${run.id}`);
}
