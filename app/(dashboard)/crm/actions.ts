'use server';

import { revalidatePath } from 'next/cache';

import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import type { GatewayRequest } from '@/types/runtime/dto';

import type { LeadStatus } from '@/types/crm';
import { LEAD_STATUSES } from '@/types/crm';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

function parseLeadStatus(value: FormDataEntryValue | null): LeadStatus {
  if (typeof value === 'string' && LEAD_STATUSES.includes(value as LeadStatus)) {
    return value as LeadStatus;
  }

  return 'new';
}

async function logCrmLeadEvent(input: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  userId: string;
  leadId: string;
  type: string;
  payload?: Record<string, unknown>;
}) {
  await input.supabase.from('events').insert({
    organization_id: input.organizationId,
    type: input.type,
    source: 'crm',
    actor_type: 'user',
    actor_id: input.userId,
    payload: {
      lead_id: input.leadId,
      ...(input.payload ?? {}),
    },
    metadata: {
      crm_lead_id: input.leadId,
    },
    correlation_id: input.leadId,
  });
}

function getOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createLead(formData: FormData) {
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

  const name = getOptionalText(formData.get('name'));

  if (!name) {
    throw new Error('Name is required');
  }

  const { data, error } = await supabase.from('crm_leads').insert({
    organization_id: organizationId,
    name,
    phone: getOptionalText(formData.get('phone')),
    email: getOptionalText(formData.get('email')),
    source: getOptionalText(formData.get('source')),
    status: parseLeadStatus(formData.get('status')),
    notes: getOptionalText(formData.get('notes')),
    created_by: user.id,
  }).select('id').single();

  if (error) {
    throw error;
  }

  if (data?.id) {
    await logCrmLeadEvent({
      supabase,
      organizationId,
      userId: user.id,
      leadId: data.id,
      type: 'crm_lead_created',
      payload: {
        name,
        source: getOptionalText(formData.get('source')),
      },
    });
  }

  revalidatePath('/crm');
}

export async function updateLead(formData: FormData) {
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

  const id = getOptionalText(formData.get('id'));

  if (!id) {
    throw new Error('Lead id is required');
  }

  const name = getOptionalText(formData.get('name'));

  if (!name) {
    throw new Error('Name is required');
  }

  const { error } = await supabase
    .from('crm_leads')
    .update({
      name,
      phone: getOptionalText(formData.get('phone')),
      email: getOptionalText(formData.get('email')),
      source: getOptionalText(formData.get('source')),
      status: parseLeadStatus(formData.get('status')),
      notes: getOptionalText(formData.get('notes')),
      updated_by: user.id,
    })
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  revalidatePath('/crm');
}

export async function deleteLead(formData: FormData) {
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

  const id = getOptionalText(formData.get('id'));

  if (!id) {
    throw new Error('Lead id is required');
  }

  const { error } = await supabase
    .from('crm_leads')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  revalidatePath('/crm');
}


export async function updateLeadStatusQuick(
  leadId: string,
  status: LeadStatus,
) {
  if (!LEAD_STATUSES.includes(status)) {
    throw new Error('Invalid lead status');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error('Organization not found');

  const updates: Record<string, unknown> = {
    status,
    updated_by: user.id,
  };

  if (status === 'contacted' || status === 'qualified') {
    updates.last_contact_at = new Date().toISOString();
  }

  const { data: previous } = await supabase
    .from('crm_leads')
    .select('status, name')
    .eq('id', leadId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  const { error } = await supabase
    .from('crm_leads')
    .update(updates)
    .eq('id', leadId)
    .eq('organization_id', organizationId);

  if (error) throw error;

  await logCrmLeadEvent({
    supabase,
    organizationId,
    userId: user.id,
    leadId,
    type: 'crm_lead_status_changed',
    payload: {
      from: previous?.status ?? null,
      to: status,
      name: previous?.name ?? null,
    },
  });

  revalidatePath('/crm');
  revalidatePath('/crm/' + leadId);
}


export async function scheduleLeadFollowUp(
  leadId: string,
  daysFromNow: 1 | 3 | 7,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error('Organization not found');

  const { data: lead, error: leadError } = await supabase
    .from('crm_leads')
    .select('id, name, project_id')
    .eq('organization_id', organizationId)
    .eq('id', leadId)
    .maybeSingle();

  if (leadError) throw leadError;
  if (!lead) throw new Error('Lead not found');

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + daysFromNow);
  dueAt.setHours(11, 0, 0, 0);

  const marker = 'CRM_LEAD_ID:' + lead.id;

  const { data: existingTask } = await supabase
    .from('tasks')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'todo')
    .ilike('description', '%' + marker + '%')
    .maybeSingle();

  if (existingTask?.id) {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: 'Связаться: ' + lead.name,
        due_at: dueAt.toISOString(),
        priority: 2,
        updated_by: user.id,
      })
      .eq('id', existingTask.id)
      .eq('organization_id', organizationId);

    if (error) throw error;
  } else {
    const { error } = await supabase.from('tasks').insert({
      organization_id: organizationId,
      project_id: lead.project_id,
      title: 'Связаться: ' + lead.name,
      description: marker + '\nCRM follow-up',
      status: 'todo',
      priority: 2,
      due_at: dueAt.toISOString(),
      created_by: user.id,
    });

    if (error) throw error;
  }

  await logCrmLeadEvent({
    supabase,
    organizationId,
    userId: user.id,
    leadId: lead.id,
    type: 'crm_followup_scheduled',
    payload: {
      due_at: dueAt.toISOString(),
      days_from_now: daysFromNow,
    },
  });

  revalidatePath('/crm');
  revalidatePath('/crm/' + lead.id);

  return {
    leadId: lead.id,
    dueAt: dueAt.toISOString(),
  };
}


export async function addLeadNote(leadId: string, note: string) {
  const trimmed = note.trim();
  if (!trimmed) throw new Error('Введите заметку.');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error('Organization not found');

  const { data: lead, error: leadError } = await supabase
    .from('crm_leads')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('id', leadId)
    .maybeSingle();

  if (leadError) throw leadError;
  if (!lead) throw new Error('Lead not found');

  await logCrmLeadEvent({
    supabase,
    organizationId,
    userId: user.id,
    leadId,
    type: 'crm_note_added',
    payload: {
      note: trimmed,
    },
  });

  revalidatePath('/crm/' + leadId);
}

export async function generateLeadNextStepAction(leadId: string): Promise<
  | { status: 'generated'; text: string }
  | { status: 'failed'; message: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: 'failed', message: 'Требуется авторизация.' };

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) return { status: 'failed', message: 'Организация не найдена.' };

  const { data: lead } = await supabase
    .from('crm_leads')
    .select('id, name, email, phone, status, source, notes, last_contact_at')
    .eq('organization_id', organizationId)
    .eq('id', leadId)
    .maybeSingle();

  if (!lead) return { status: 'failed', message: 'Лид не найден.' };

  const { data: events } = await supabase
    .from('events')
    .select('type, payload, created_at')
    .eq('organization_id', organizationId)
    .eq('correlation_id', leadId)
    .order('created_at', { ascending: false })
    .limit(12);

  const runId = crypto.randomUUID();
  const request: GatewayRequest = {
    scope: {
      organizationId,
      userId: user.id,
    },
    trace: {
      runId,
      traceId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    },
    providerCode: 'auto',
    modelCode: 'auto',
    messages: [
      {
        role: 'user',
        content: [
          'Определи один лучший следующий шаг по этому лиду.',
          'Не выдумывай факты и не дави на клиента.',
          'Верни 1–3 коротких предложения по-русски: что сделать сейчас и почему.',
          '',
          'Лид:',
          JSON.stringify(lead, null, 2),
          '',
          'Последние события:',
          JSON.stringify(events ?? [], null, 2),
        ].join('\n'),
      },
    ],
    tools: [],
    parameters: {
      temperature: 0.25,
      maxTokens: 180,
    },
    timeoutMs: 25_000,
    retryPolicy: {
      maxAttempts: 2,
      backoffMs: [500, 1000],
    },
    routing: {
      intent: 'crm_next_step',
      taskCategory: 'planning',
      estimatedContextLength: JSON.stringify({ lead, events }).length,
      reasoningComplexity: 'medium',
      latencyTarget: 'balanced',
      costTarget: 'balanced',
      toolUsage: false,
    },
  };

  try {
    const response = await aiGateway.complete(request);
    const text = response.content?.trim() ?? '';

    if (!text) {
      return { status: 'failed', message: 'OSA не вернула следующий шаг.' };
    }

    await logCrmLeadEvent({
      supabase,
      organizationId,
      userId: user.id,
      leadId,
      type: 'crm_osa_next_step',
      payload: { text },
    });

    revalidatePath('/crm/' + leadId);

    return { status: 'generated', text };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Не удалось получить следующий шаг.',
    };
  }
}


export type CrmImportRow = {
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  notes?: string | null;
};

export async function importCrmLeadsAction(rows: CrmImportRow[]): Promise<{
  imported: number;
  skipped: number;
  failed: number;
  message: string;
}> {
  const safeRows = rows.slice(0, 500);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error('Organization not found');

  const { data: existing } = await supabase
    .from('crm_leads')
    .select('email, phone')
    .eq('organization_id', organizationId);

  const emailSet = new Set(
    (existing ?? [])
      .map((lead) => lead.email?.trim().toLowerCase())
      .filter((value): value is string => Boolean(value)),
  );
  const phoneSet = new Set(
    (existing ?? [])
      .map((lead) => lead.phone?.replace(/\D/g, ''))
      .filter((value): value is string => Boolean(value)),
  );

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of safeRows) {
    const name = row.name?.trim();
    const email = row.email?.trim().toLowerCase() || null;
    const phone = row.phone?.trim() || null;
    const phoneKey = phone?.replace(/\D/g, '') || null;

    if (!name) {
      failed += 1;
      continue;
    }

    const duplicate =
      (email && emailSet.has(email)) ||
      (phoneKey && phoneSet.has(phoneKey));

    if (duplicate) {
      skipped += 1;
      continue;
    }

    const { data: inserted, error } = await supabase
      .from('crm_leads')
      .insert({
        organization_id: organizationId,
        name,
        email,
        phone,
        source: row.source?.trim() || 'CSV import',
        notes: row.notes?.trim() || null,
        status: 'new',
        created_by: user.id,
      })
      .select('id')
      .single();

    if (error || !inserted?.id) {
      failed += 1;
      continue;
    }

    imported += 1;
    if (email) emailSet.add(email);
    if (phoneKey) phoneSet.add(phoneKey);

    await supabase.from('events').insert({
      organization_id: organizationId,
      type: 'crm_lead_created',
      source: 'crm-import',
      actor_type: 'user',
      actor_id: user.id,
      payload: {
        lead_id: inserted.id,
        name,
        source: row.source?.trim() || 'CSV import',
      },
      metadata: {
        crm_lead_id: inserted.id,
        import: 'csv',
      },
      correlation_id: inserted.id,
    });
  }

  revalidatePath('/crm');
  revalidatePath('/crm/analytics');

  return {
    imported,
    skipped,
    failed,
    message:
      'Импортировано: ' +
      imported +
      '. Пропущено дублей: ' +
      skipped +
      '. Ошибок: ' +
      failed +
      '.',
  };
}


export async function mergeDuplicateLeadsAction(input: {
  primaryLeadId: string;
  duplicateLeadIds: string[];
}): Promise<{ merged: number; message: string }> {
  const primaryLeadId = input.primaryLeadId.trim();
  const duplicateLeadIds = [...new Set(input.duplicateLeadIds.map((id) => id.trim()))]
    .filter((id) => id && id !== primaryLeadId)
    .slice(0, 20);

  if (!primaryLeadId || !duplicateLeadIds.length) {
    return { merged: 0, message: 'Нет дублей для объединения.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error('Organization not found');

  const { data: leads, error: leadsError } = await supabase
    .from('crm_leads')
    .select(
      'id, name, email, phone, source, notes, project_id, status, created_at, last_contact_at',
    )
    .eq('organization_id', organizationId)
    .in('id', [primaryLeadId, ...duplicateLeadIds]);

  if (leadsError) throw leadsError;

  const primary = (leads ?? []).find((lead) => lead.id === primaryLeadId);
  if (!primary) throw new Error('Основной лид не найден.');

  const duplicates = (leads ?? []).filter((lead) => duplicateLeadIds.includes(lead.id));
  if (!duplicates.length) {
    return { merged: 0, message: 'Дубли не найдены.' };
  }

  const firstNonEmpty = <T,>(current: T | null | undefined, values: Array<T | null | undefined>) => {
    if (current !== null && current !== undefined && String(current).trim()) return current;
    return values.find((value) => value !== null && value !== undefined && String(value).trim()) ?? null;
  };

  const combinedNotes = [
    primary.notes?.trim() || '',
    ...duplicates
      .map((lead) => lead.notes?.trim() || '')
      .filter(Boolean)
      .map((note, index) => 'Из дубля ' + String(index + 1) + ':\n' + note),
  ]
    .filter(Boolean)
    .join('\n\n');

  const statusRank: Record<string, number> = {
    new: 0,
    contacted: 1,
    qualified: 2,
    won: 3,
    lost: 1,
  };

  const bestStatus = [primary, ...duplicates].reduce((best, lead) => {
    return (statusRank[lead.status] ?? 0) > (statusRank[best] ?? 0) ? lead.status : best;
  }, primary.status);

  const latestContact = [primary.last_contact_at, ...duplicates.map((lead) => lead.last_contact_at)]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;

  const { error: primaryUpdateError } = await supabase
    .from('crm_leads')
    .update({
      email: firstNonEmpty(primary.email, duplicates.map((lead) => lead.email)),
      phone: firstNonEmpty(primary.phone, duplicates.map((lead) => lead.phone)),
      source: firstNonEmpty(primary.source, duplicates.map((lead) => lead.source)),
      project_id: firstNonEmpty(primary.project_id, duplicates.map((lead) => lead.project_id)),
      notes: combinedNotes || null,
      status: bestStatus,
      last_contact_at: latestContact,
      updated_by: user.id,
    })
    .eq('id', primaryLeadId)
    .eq('organization_id', organizationId);

  if (primaryUpdateError) throw primaryUpdateError;

  for (const duplicate of duplicates) {
    await supabase
      .from('events')
      .update({
        correlation_id: primaryLeadId,
      })
      .eq('organization_id', organizationId)
      .eq('correlation_id', duplicate.id);

    const marker = 'CRM_LEAD_ID:' + duplicate.id;
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, description')
      .eq('organization_id', organizationId)
      .ilike('description', '%' + marker + '%');

    for (const task of tasks ?? []) {
      await supabase
        .from('tasks')
        .update({
          description: (task.description ?? '').replace(
            marker,
            'CRM_LEAD_ID:' + primaryLeadId,
          ),
          updated_by: user.id,
        })
        .eq('id', task.id)
        .eq('organization_id', organizationId);
    }
  }

  const duplicateIds = duplicates.map((lead) => lead.id);

  const { error: deleteError } = await supabase
    .from('crm_leads')
    .delete()
    .eq('organization_id', organizationId)
    .in('id', duplicateIds);

  if (deleteError) throw deleteError;

  await supabase.from('events').insert({
    organization_id: organizationId,
    type: 'crm_leads_merged',
    source: 'crm',
    actor_type: 'user',
    actor_id: user.id,
    payload: {
      lead_id: primaryLeadId,
      merged_ids: duplicateIds,
      merged_count: duplicateIds.length,
    },
    metadata: {
      crm_lead_id: primaryLeadId,
    },
    correlation_id: primaryLeadId,
  });

  revalidatePath('/crm');
  revalidatePath('/crm/duplicates');
  revalidatePath('/crm/analytics');
  revalidatePath('/crm/inbox');
  revalidatePath('/crm/' + primaryLeadId);

  return {
    merged: duplicateIds.length,
    message: 'Объединено дублей: ' + duplicateIds.length + '.',
  };
}


export async function claimInboundMessageAction(eventId: string): Promise<{
  leadId: string;
  created: boolean;
  message: string;
}> {
  const cleanEventId = eventId.trim();
  if (!cleanEventId) throw new Error('Входящее сообщение не указано.');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error('Organization not found');

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, type, source, payload, metadata, created_at')
    .eq('organization_id', organizationId)
    .eq('id', cleanEventId)
    .maybeSingle();

  if (eventError) throw eventError;
  if (!event) throw new Error('Входящее сообщение не найдено.');

  if (
    event.type !== 'crm_whatsapp_received_unmatched' &&
    event.type !== 'crm_sms_received_unmatched'
  ) {
    throw new Error('Это сообщение уже привязано или не относится к CRM.');
  }

  const { data: alreadyClaimed } = await supabase
    .from('events')
    .select('correlation_id')
    .eq('organization_id', organizationId)
    .contains('metadata', { original_event_id: cleanEventId })
    .not('correlation_id', 'is', null)
    .limit(1)
    .maybeSingle();

  if (alreadyClaimed?.correlation_id) {
    return {
      leadId: alreadyClaimed.correlation_id,
      created: false,
      message: 'Сообщение уже привязано к карточке клиента.',
    };
  }

  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const phone =
    typeof payload.phone === 'string' ? payload.phone.trim() : '';
  const senderName =
    typeof payload.sender_name === 'string' ? payload.sender_name.trim() : '';
  const text =
    typeof payload.text === 'string' ? payload.text.trim() : '';

  const phoneKey = phone.replace(/\D/g, '');
  if (!phoneKey) throw new Error('У входящего сообщения нет номера телефона.');

  const { data: candidates } = await supabase
    .from('crm_leads')
    .select('id, phone, name')
    .eq('organization_id', organizationId)
    .not('phone', 'is', null)
    .limit(5000);

  const existingLead =
    (candidates ?? []).find((lead) => {
      const candidate = (lead.phone ?? '').replace(/\D/g, '');
      return (
        candidate === phoneKey ||
        (candidate.length >= 10 &&
          phoneKey.length >= 10 &&
          candidate.slice(-10) === phoneKey.slice(-10))
      );
    }) ?? null;

  let leadId = existingLead?.id ?? null;
  let created = false;

  if (!leadId) {
    const displayName = senderName || 'Контакт ' + phone;
    const source =
      event.type === 'crm_sms_received_unmatched'
        ? 'Входящее SMS'
        : 'Входящий WhatsApp';

    const { data: insertedLead, error: insertError } = await supabase
      .from('crm_leads')
      .insert({
        organization_id: organizationId,
        name: displayName,
        phone,
        status: 'contacted',
        source,
        notes: text ? 'Первое входящее сообщение:\n' + text : null,
        last_contact_at: event.created_at,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    leadId = insertedLead.id;
    created = true;
  } else {
    const { error: updateError } = await supabase
      .from('crm_leads')
      .update({
        status: 'contacted',
        last_contact_at: event.created_at,
        updated_by: user.id,
      })
      .eq('organization_id', organizationId)
      .eq('id', leadId);

    if (updateError) throw updateError;
  }

  const matchedType =
    event.type === 'crm_sms_received_unmatched'
      ? 'crm_sms_received'
      : 'crm_whatsapp_received';

  const metadata = (event.metadata ?? {}) as Record<string, unknown>;

  const { error: matchedEventError } = await supabase.from('events').insert({
    organization_id: organizationId,
    type: matchedType,
    source: event.source,
    actor_type: 'external',
    actor_id: null,
    payload: {
      ...payload,
      lead_id: leadId,
    },
    metadata: {
      ...metadata,
      crm_lead_id: leadId,
      original_event_id: event.id,
      claimed_at: new Date().toISOString(),
    },
    correlation_id: leadId,
    created_at: event.created_at,
  });

  if (matchedEventError) throw matchedEventError;

  revalidatePath('/crm');
  revalidatePath('/crm/inbox');
  revalidatePath('/crm/analytics');
  revalidatePath('/crm/' + leadId);

  return {
    leadId,
    created,
    message: created
      ? 'Создана новая карточка клиента.'
      : 'Сообщение привязано к существующему клиенту.',
  };
}
