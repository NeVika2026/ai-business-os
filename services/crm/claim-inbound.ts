import type { SupabaseClient } from '@supabase/supabase-js';

import { normalizeContactPhone } from '@/lib/crm/inbox-conversations';

const unmatchedTypes = ['crm_whatsapp_received_unmatched', 'crm_sms_received_unmatched'];
const eventColumns = 'id, type, source, payload, metadata, created_at';
const pageSize = 500;

type InboundEvent = {
  id: string;
  type: string;
  source: string;
  payload: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function getText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function loadInboundClaims(
  supabase: SupabaseClient,
  organizationId: string,
  messageIds: string[],
) {
  const claims: Array<{ originalId: string; leadId: string }> = [];
  for (let offset = 0; offset < messageIds.length; offset += 100) {
    const { data, error } = await supabase
      .from('events')
      .select('metadata, correlation_id')
      .eq('organization_id', organizationId)
      .in('metadata->>original_event_id', messageIds.slice(offset, offset + 100))
      .not('correlation_id', 'is', null);

    if (error) throw error;
    for (const claim of data ?? []) {
      const originalId = getText(claim.metadata?.original_event_id);
      if (originalId && claim.correlation_id) {
        claims.push({ originalId, leadId: claim.correlation_id });
      }
    }
  }
  return claims;
}

/** Called only after the server action has authenticated the user and org. */
export async function claimInboundConversation(input: {
  supabase: SupabaseClient;
  organizationId: string;
  userId: string;
  eventId: string;
}) {
  const { supabase, organizationId, userId, eventId } = input;
  const { data: selected, error: selectedError } = await supabase
    .from('events')
    .select(eventColumns)
    .eq('organization_id', organizationId)
    .eq('id', eventId)
    .maybeSingle();

  if (selectedError) throw selectedError;
  if (!selected) throw new Error('Входящее сообщение не найдено.');
  if (!unmatchedTypes.includes(selected.type)) {
    throw new Error('Это сообщение уже привязано или не относится к CRM.');
  }

  const phone = getText(selected.payload?.phone);
  const phoneKey = normalizeContactPhone(phone);
  if (!phoneKey) throw new Error('У входящего сообщения нет номера телефона.');

  // A contact can write several times, through either channel, before being
  // added to CRM. Load the whole conversation, including older inbox pages.
  const messagesById = new Map<string, InboundEvent>([[selected.id, selected]]);
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('events')
      .select(eventColumns)
      .eq('organization_id', organizationId)
      .in('type', unmatchedTypes)
      .contains('metadata', { phone_key: phoneKey })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    for (const message of data ?? []) {
      // Never rely on provider metadata alone when attaching personal history.
      if (normalizeContactPhone(getText(message.payload?.phone)) === phoneKey) {
        messagesById.set(message.id, message);
      }
    }
    if ((data?.length ?? 0) < pageSize) break;
  }

  const messages = [...messagesById.values()].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  // Preserve the existing append-only event model and legacy claim records.
  // Separate reads avoid a claim disappearing at the inbox's event limit.
  const claims = await loadInboundClaims(
    supabase,
    organizationId,
    messages.map((message) => message.id),
  );
  const claimedIds = new Set(claims.map((claim) => claim.originalId));
  const claimedLeadIds = new Set(claims.map((claim) => claim.leadId));

  if (claimedLeadIds.size > 1) {
    throw new Error(
      'Переписка уже связана с несколькими карточками. Сначала объедините дубли в CRM.',
    );
  }

  let leadId: string | null = [...claimedLeadIds][0] ?? null;
  let created = false;

  if (leadId) {
    const { data: lead, error } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('id', leadId)
      .maybeSingle();

    if (error) throw error;
    if (!lead) throw new Error('Связанная карточка клиента больше недоступна.');
  } else {
    for (let offset = 0; ; offset += pageSize) {
      const { data: candidates, error } = await supabase
        .from('crm_leads')
        .select('id, phone')
        .eq('organization_id', organizationId)
        .not('phone', 'is', null)
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      const existing = (candidates ?? []).find(
        (lead) => normalizeContactPhone(lead.phone ?? '') === phoneKey,
      );
      if (existing) {
        leadId = existing.id;
        break;
      }
      if ((candidates?.length ?? 0) < pageSize) break;
    }
  }

  const firstMessage = messages[0];
  const latestMessage = messages[messages.length - 1];
  if (!leadId) {
    const senderName = [...messages]
      .reverse()
      .map((message) => getText(message.payload?.sender_name))
      .find(Boolean);
    const firstText = getText(firstMessage.payload?.text);
    const { data: insertedLead, error } = await supabase
      .from('crm_leads')
      .insert({
        organization_id: organizationId,
        name: senderName || 'Контакт ' + phone,
        phone,
        status: 'contacted',
        source:
          firstMessage.type === 'crm_sms_received_unmatched' ? 'Входящее SMS' : 'Входящий WhatsApp',
        notes: firstText ? 'Первое входящее сообщение:\n' + firstText : null,
        last_contact_at: latestMessage.created_at,
        created_by: userId,
      })
      .select('id')
      .single();

    if (error) throw error;
    leadId = insertedLead.id as string;
    created = true;
  }

  const pending = messages.filter((message) => !claimedIds.has(message.id));
  if (pending.length) {
    const claimedAt = new Date().toISOString();
    const { error } = await supabase.from('events').insert(
      pending.map((message) => ({
        organization_id: organizationId,
        type:
          message.type === 'crm_sms_received_unmatched'
            ? 'crm_sms_received'
            : 'crm_whatsapp_received',
        source: message.source,
        actor_type: 'external',
        actor_id: null,
        payload: { ...message.payload, lead_id: leadId },
        metadata: {
          ...message.metadata,
          crm_lead_id: leadId,
          original_event_id: message.id,
          claimed_at: claimedAt,
        },
        correlation_id: leadId,
        created_at: message.created_at,
      })),
    );
    if (error) throw error;
  }

  if (!created) {
    // Conditional writes preserve a deal status or a more recent contact even
    // if another operator has changed the card while the history was loading.
    const { error: statusError } = await supabase
      .from('crm_leads')
      .update({ status: 'contacted', updated_by: userId })
      .eq('organization_id', organizationId)
      .eq('id', leadId)
      .eq('status', 'new');
    if (statusError) throw statusError;

    const { error: contactError } = await supabase
      .from('crm_leads')
      .update({ last_contact_at: latestMessage.created_at, updated_by: userId })
      .eq('organization_id', organizationId)
      .eq('id', leadId)
      .or('last_contact_at.is.null,last_contact_at.lt.' + latestMessage.created_at);
    if (contactError) throw contactError;
  }

  return {
    leadId,
    created,
    linkedCount: pending.length,
    message: pending.length
      ? (created ? 'Карточка создана. ' : 'Карточка обновлена. ') +
        'Сообщений в истории: ' +
        messages.length +
        '.'
      : 'Вся переписка уже сохранена в карточке клиента.',
  };
}
