'use server';

import { revalidatePath } from 'next/cache';

import { FollowUpError, followUpPreset } from '@/lib/crm/follow-ups';
import { scheduleCrmFollowUp, resolveCrmFollowUp } from '@/services/crm/follow-ups';
import { DuplicateMergeError, mergeDuplicateLeads } from '@/services/crm/merge-duplicates';

import { claimInboundConversation } from '@/services/crm/claim-inbound';

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


async function followUpActor(leadId: string) {
  if (typeof leadId !== 'string' || !leadId.trim()) throw new FollowUpError('Выберите клиента.');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new FollowUpError('Войдите в аккаунт, чтобы изменить напоминание.');
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new FollowUpError('Организация не найдена.');
  return { supabase, organizationId, userId: user.id, leadId: leadId.trim() };
}

function refreshFollowUps(leadId: string) {
  revalidatePath('/crm');
  revalidatePath('/crm/inbox');
  revalidatePath('/crm/analytics');
  revalidatePath('/crm/' + leadId);
}

export async function scheduleLeadFollowUp(
  leadId: string,
  when: 1 | 3 | 7 | string,
  options: { note?: string; taskId?: string; expectedDueAt?: string } = {},
) {
  try {
    const actor = await followUpActor(leadId);
    const result = await scheduleCrmFollowUp({
      ...actor,
      dueAt: typeof when === 'number' ? followUpPreset(when, new Date()) : when,
      note: options.note,
      taskId: options.taskId,
      expectedDueAt: options.expectedDueAt,
    });
    refreshFollowUps(actor.leadId);
    return { ok: true as const, ...result };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof FollowUpError
          ? error.message
          : 'Не удалось сохранить напоминание. Попробуйте ещё раз.',
    };
  }
}

export async function resolveLeadFollowUp(
  leadId: string,
  taskId: string,
  expectedDueAt: string,
  outcome: 'done' | 'cancelled',
) {
  try {
    const actor = await followUpActor(leadId);
    const result = await resolveCrmFollowUp({ ...actor, taskId, expectedDueAt, outcome });
    refreshFollowUps(actor.leadId);
    return { ok: true as const, ...result };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof FollowUpError
          ? error.message
          : 'Не удалось закрыть напоминание. Попробуйте ещё раз.',
    };
  }
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error('Organization not found');

  try {
    const result = await mergeDuplicateLeads({
      supabase,
      organizationId,
      userId: user.id,
      primaryLeadId: input.primaryLeadId,
      duplicateLeadIds: input.duplicateLeadIds,
    });

    revalidatePath('/crm');
    revalidatePath('/crm/duplicates');
    revalidatePath('/crm/analytics');
    revalidatePath('/crm/inbox');
    revalidatePath('/crm/' + input.primaryLeadId.trim());

    return {
      merged: result.merged,
      message: result.message,
    };
  } catch (error) {
    if (error instanceof DuplicateMergeError) throw error;
    throw new Error('Не удалось завершить объединение. Уже перенесённые данные сохранены; обновите страницу и повторите.');
  }
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

  const result = await claimInboundConversation({
    supabase,
    organizationId,
    userId: user.id,
    eventId: cleanEventId,
  });

  revalidatePath('/crm');
  revalidatePath('/crm/inbox');
  revalidatePath('/crm/analytics');
  revalidatePath('/crm/' + result.leadId);

  return result;
}
