import type { SupabaseClient } from '@supabase/supabase-js';

import {
  FollowUpError,
  MANUAL_FOLLOW_UP_MARKER,
  followUpLeadId,
  followUpNote,
  validateFollowUpDate,
} from '@/lib/crm/follow-ups';

type CrmActor = {
  supabase: SupabaseClient;
  organizationId: string;
  userId: string;
  leadId: string;
};

type FollowUpTask = {
  id: string;
  status: string;
  due_at: string | null;
  description: string | null;
  updated_at: string;
};

async function requireLead(input: CrmActor) {
  const { data, error } = await input.supabase
    .from('crm_leads')
    .select('id, name, project_id')
    .eq('organization_id', input.organizationId)
    .eq('id', input.leadId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new FollowUpError('Карточка клиента не найдена.');
  return data;
}

async function requireTask(input: CrmActor, taskId: string, expectedDueAt?: string) {
  const { data, error } = await input.supabase
    .from('tasks')
    .select('id, status, due_at, description, updated_at')
    .eq('organization_id', input.organizationId)
    .eq('id', taskId)
    .maybeSingle();
  if (error) throw error;
  if (!data || followUpLeadId(data.description) !== input.leadId) {
    throw new FollowUpError('Напоминание не найдено в карточке клиента.');
  }
  if (
    !data.due_at ||
    !expectedDueAt ||
    new Date(data.due_at).getTime() !== new Date(expectedDueAt).getTime()
  ) {
    throw new FollowUpError('Напоминание уже перенесено. Обновите страницу.');
  }
  return data as FollowUpTask;
}

async function logFollowUp(input: CrmActor, type: string, payload: Record<string, unknown>) {
  const { error } = await input.supabase.from('events').insert({
    organization_id: input.organizationId,
    type,
    source: 'crm',
    actor_type: 'user',
    actor_id: input.userId,
    payload: { ...payload, lead_id: input.leadId },
    metadata: { crm_lead_id: input.leadId },
    correlation_id: input.leadId,
  });
  return !error;
}

export async function scheduleCrmFollowUp(
  input: CrmActor & {
    dueAt: string;
    note?: string;
    taskId?: string;
    expectedDueAt?: string;
    now?: Date;
  },
) {
  const dueAt = validateFollowUpDate(input.dueAt, input.now ?? new Date());
  if (input.note !== undefined && (typeof input.note !== 'string' || input.note.length > 2000)) {
    throw new FollowUpError('Комментарий должен быть не длиннее 2000 символов.');
  }
  const lead = await requireLead(input);
  let existing: FollowUpTask | null = null;
  if (input.taskId) {
    existing = await requireTask(input, input.taskId, input.expectedDueAt);
    if (existing.status !== 'todo')
      throw new FollowUpError('Напоминание уже закрыто. Обновите страницу.');
  } else {
    const { data, error } = await input.supabase
      .from('tasks')
      .select('id, status, due_at, description, updated_at')
      .eq('organization_id', input.organizationId)
      .eq('status', 'todo')
      .like('description', 'CRM\\_LEAD\\_ID:' + lead.id + '\n%')
      .order('due_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(1);
    if (error) throw error;
    existing =
      (data?.find((task) => followUpLeadId(task.description) === input.leadId) as FollowUpTask) ??
      null;
  }

  const note = input.note?.trim() ?? followUpNote(existing?.description);
  const values = {
    title: 'Связаться: ' + lead.name,
    description:
      'CRM_LEAD_ID:' + lead.id + '\n' + MANUAL_FOLLOW_UP_MARKER + (note ? '\n' + note : ''),
    due_at: dueAt,
    priority: 2,
  };

  let taskId: string;
  if (existing) {
    const { data, error } = await input.supabase
      .from('tasks')
      .update({ ...values, updated_by: input.userId })
      .eq('organization_id', input.organizationId)
      .eq('id', existing.id)
      .eq('status', 'todo')
      .eq('updated_at', existing.updated_at)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new FollowUpError('Напоминание уже изменилось. Обновите страницу.');
    taskId = data.id;
  } else {
    const { data, error } = await input.supabase
      .from('tasks')
      .insert({
        ...values,
        organization_id: input.organizationId,
        project_id: lead.project_id,
        status: 'todo',
        created_by: input.userId,
      })
      .select('id')
      .single();
    if (error) throw error;
    taskId = data.id;
  }

  const historySaved = await logFollowUp(
    input,
    existing ? 'crm_followup_rescheduled' : 'crm_followup_scheduled',
    { task_id: taskId, due_at: dueAt, previous_due_at: existing?.due_at ?? null, note },
  );
  return {
    leadId: input.leadId,
    taskId,
    dueAt,
    historySaved,
    message: historySaved
      ? existing
        ? 'Напоминание перенесено.'
        : 'Напоминание сохранено.'
      : 'Напоминание сохранено, но запись в истории пока недоступна.',
  };
}

export async function resolveCrmFollowUp(
  input: CrmActor & { taskId: string; expectedDueAt: string; outcome: 'done' | 'cancelled' },
) {
  if (!['done', 'cancelled'].includes(input.outcome))
    throw new FollowUpError('Некорректное действие.');
  await requireLead(input);
  const task = await requireTask(input, input.taskId, input.expectedDueAt);
  if (task.status === input.outcome)
    return { historySaved: true, message: 'Напоминание уже закрыто.' };
  if (task.status !== 'todo')
    throw new FollowUpError('Напоминание уже закрыто. Обновите страницу.');

  const { data, error } = await input.supabase
    .from('tasks')
    .update({ status: input.outcome, updated_by: input.userId })
    .eq('organization_id', input.organizationId)
    .eq('id', task.id)
    .eq('status', 'todo')
    .eq('updated_at', task.updated_at)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new FollowUpError('Напоминание уже изменилось. Обновите страницу.');

  const historySaved = await logFollowUp(
    input,
    input.outcome === 'done' ? 'crm_followup_completed' : 'crm_followup_cancelled',
    { task_id: task.id, due_at: task.due_at },
  );
  return {
    historySaved,
    message: historySaved
      ? input.outcome === 'done'
        ? 'Напоминание выполнено.'
        : 'Напоминание отменено.'
      : 'Напоминание закрыто, но запись в истории пока недоступна.',
  };
}

// Only due legacy reminders retain automatic completion after communication.
// Explicitly planned contacts are completed by their owner.
export async function completeAutomaticCrmFollowUps(input: {
  supabase: SupabaseClient;
  organizationId: string;
  leadId: string;
  userId?: string;
  now?: Date;
}) {
  return input.supabase
    .from('tasks')
    .update({ status: 'done', ...(input.userId ? { updated_by: input.userId } : {}) })
    .eq('organization_id', input.organizationId)
    .eq('status', 'todo')
    .like('description', 'CRM\\_LEAD\\_ID:' + input.leadId + '\n%')
    .not('description', 'ilike', '%' + MANUAL_FOLLOW_UP_MARKER + '%')
    .lte('due_at', (input.now ?? new Date()).toISOString());
}
