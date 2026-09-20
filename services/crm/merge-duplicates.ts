import type { SupabaseClient } from '@supabase/supabase-js';

export class DuplicateMergeError extends Error {}

type MergeActor = {
  supabase: SupabaseClient;
  organizationId: string;
  userId: string;
};

type MergeLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  notes: string | null;
  project_id: string | null;
  status: string;
  assigned_to: string | null;
  last_contact_at: string | null;
  updated_at: string;
};

function firstNonEmpty<T>(current: T | null | undefined, values: Array<T | null | undefined>) {
  if (current !== null && current !== undefined && String(current).trim()) return current;
  return values.find((value) => value !== null && value !== undefined && String(value).trim()) ?? null;
}

function mergedNotes(primary: MergeLead, duplicates: MergeLead[]) {
  let notes = primary.notes?.trim() ?? '';

  for (const duplicate of duplicates) {
    const duplicateNote = duplicate.notes?.trim();
    if (!duplicateNote || notes.includes(duplicateNote)) continue;
    const block = 'Из объединённой карточки «' + duplicate.name + '»:\n' + duplicateNote;
    notes = notes ? notes + '\n\n' + block : block;
  }

  return notes || null;
}

function mergedStatus(primary: MergeLead, duplicates: MergeLead[]) {
  const rank: Record<string, number> = {
    new: 0,
    contacted: 1,
    lost: 1,
    qualified: 2,
    won: 3,
  };

  return [primary, ...duplicates].reduce(
    (best, lead) => ((rank[lead.status] ?? 0) > (rank[best] ?? 0) ? lead.status : best),
    primary.status,
  );
}

function latestContact(primary: MergeLead, duplicates: MergeLead[]) {
  return [primary.last_contact_at, ...duplicates.map((lead) => lead.last_contact_at)]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
}

async function moveLeadEvents(input: MergeActor, duplicateLeadId: string, primaryLeadId: string) {
  const { data, error } = await input.supabase
    .from('events')
    .select('id, payload, metadata')
    .eq('organization_id', input.organizationId)
    .eq('correlation_id', duplicateLeadId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  for (const event of data ?? []) {
    const payload =
      event.payload && typeof event.payload === 'object'
        ? { ...event.payload, lead_id: primaryLeadId }
        : { lead_id: primaryLeadId };
    const metadata =
      event.metadata && typeof event.metadata === 'object'
        ? { ...event.metadata, crm_lead_id: primaryLeadId }
        : { crm_lead_id: primaryLeadId };

    const { data: moved, error: moveError } = await input.supabase
      .from('events')
      .update({
        correlation_id: primaryLeadId,
        payload,
        metadata,
      })
      .eq('organization_id', input.organizationId)
      .eq('id', event.id)
      .eq('correlation_id', duplicateLeadId)
      .select('id')
      .maybeSingle();

    if (moveError) throw moveError;
    if (!moved) throw new DuplicateMergeError('История клиента уже изменилась. Обновите страницу.');
  }
}

async function moveLeadTasks(
  input: MergeActor,
  duplicateLeadId: string,
  primaryLeadId: string,
  primaryName: string,
) {
  const marker = 'CRM_LEAD_ID:' + duplicateLeadId;
  const nextMarker = 'CRM_LEAD_ID:' + primaryLeadId;

  const { data, error } = await input.supabase
    .from('tasks')
    .select('id, description')
    .eq('organization_id', input.organizationId)
    .like('description', 'CRM\\_LEAD\\_ID:' + duplicateLeadId + '\n%');

  if (error) throw error;

  for (const task of data ?? []) {
    const description = task.description ?? '';
    if (!description.startsWith(marker + '\n')) continue;

    const { data: moved, error: moveError } = await input.supabase
      .from('tasks')
      .update({
        title: 'Связаться: ' + primaryName,
        description: nextMarker + description.slice(marker.length),
        updated_by: input.userId,
      })
      .eq('organization_id', input.organizationId)
      .eq('id', task.id)
      .like('description', 'CRM\\_LEAD\\_ID:' + duplicateLeadId + '\n%')
      .select('id')
      .maybeSingle();

    if (moveError) throw moveError;
    if (!moved) throw new DuplicateMergeError('Напоминание уже изменилось. Обновите страницу.');
  }
}

export async function mergeDuplicateLeads(
  input: MergeActor & {
    primaryLeadId: string;
    duplicateLeadIds: string[];
  },
) {
  const primaryLeadId = input.primaryLeadId.trim();
  const duplicateLeadIds = [...new Set(input.duplicateLeadIds.map((id) => id.trim()))]
    .filter((id) => id && id !== primaryLeadId)
    .slice(0, 20);

  if (!primaryLeadId || !duplicateLeadIds.length) {
    return { merged: 0, historySaved: true, message: 'Нет дублей для объединения.' };
  }

  const requestedIds = [primaryLeadId, ...duplicateLeadIds];
  const { data, error } = await input.supabase
    .from('crm_leads')
    .select(
      'id, name, email, phone, source, notes, project_id, status, assigned_to, last_contact_at, updated_at',
    )
    .eq('organization_id', input.organizationId)
    .in('id', requestedIds);

  if (error) throw error;

  const leads = (data ?? []) as MergeLead[];
  const primary = leads.find((lead) => lead.id === primaryLeadId);
  if (!primary) throw new DuplicateMergeError('Основная карточка не найдена.');

  const byId = new Map(leads.map((lead) => [lead.id, lead]));
  const duplicates = duplicateLeadIds.map((id) => byId.get(id)).filter(Boolean) as MergeLead[];
  if (duplicates.length !== duplicateLeadIds.length) {
    throw new DuplicateMergeError('Один из дублей уже удалён, изменён или относится к другой организации.');
  }

  const { data: updatedPrimary, error: primaryError } = await input.supabase
    .from('crm_leads')
    .update({
      email: firstNonEmpty(primary.email, duplicates.map((lead) => lead.email)),
      phone: firstNonEmpty(primary.phone, duplicates.map((lead) => lead.phone)),
      source: firstNonEmpty(primary.source, duplicates.map((lead) => lead.source)),
      project_id: firstNonEmpty(primary.project_id, duplicates.map((lead) => lead.project_id)),
      assigned_to: firstNonEmpty(primary.assigned_to, duplicates.map((lead) => lead.assigned_to)),
      notes: mergedNotes(primary, duplicates),
      status: mergedStatus(primary, duplicates),
      last_contact_at: latestContact(primary, duplicates),
      updated_by: input.userId,
    })
    .eq('organization_id', input.organizationId)
    .eq('id', primary.id)
    .eq('updated_at', primary.updated_at)
    .select('id')
    .maybeSingle();

  if (primaryError) throw primaryError;
  if (!updatedPrimary) {
    throw new DuplicateMergeError('Основная карточка уже изменилась. Обновите страницу.');
  }

  let merged = 0;
  for (const duplicate of duplicates) {
    await moveLeadEvents(input, duplicate.id, primary.id);
    await moveLeadTasks(input, duplicate.id, primary.id, primary.name);

    const { data: removed, error: deleteError } = await input.supabase
      .from('crm_leads')
      .delete()
      .eq('organization_id', input.organizationId)
      .eq('id', duplicate.id)
      .eq('updated_at', duplicate.updated_at)
      .select('id')
      .maybeSingle();

    if (deleteError) throw deleteError;
    if (!removed) {
      throw new DuplicateMergeError(
        'Один из дублей изменился во время объединения. Его карточка сохранена — обновите страницу и повторите.',
      );
    }

    merged += 1;
  }

  const { error: historyError } = await input.supabase.from('events').insert({
    organization_id: input.organizationId,
    type: 'crm_leads_merged',
    source: 'crm',
    actor_type: 'user',
    actor_id: input.userId,
    payload: {
      lead_id: primary.id,
      merged_ids: duplicates.map((lead) => lead.id),
      merged_count: merged,
    },
    metadata: {
      crm_lead_id: primary.id,
    },
    correlation_id: primary.id,
  });

  const historySaved = !historyError;
  return {
    merged,
    historySaved,
    message: historySaved
      ? 'Объединено дублей: ' + merged + '.'
      : 'Дубли объединены, но запись в истории пока недоступна.',
  };
}
