import { createAdminClient } from '@/services/supabase/admin';

export type InboundCommunicationChannel = 'whatsapp' | 'sms';

function normalizePhone(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '');
}

function comparablePhone(value: string | null | undefined) {
  const digits = normalizePhone(value);
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function recordInboundCommunication(input: {
  organizationId: string;
  channel: InboundCommunicationChannel;
  from: string;
  text: string;
  providerMessageId?: string | null;
  providerTimestamp?: string | null;
  raw?: Record<string, unknown> | null;
}) {
  const admin = createAdminClient();
  const fromDigits = normalizePhone(input.from);
  const comparableFrom = comparablePhone(input.from);

  if (!fromDigits || !input.text.trim()) {
    return { matched: false, leadId: null as string | null };
  }

  if (input.providerMessageId?.trim()) {
    const { data: duplicate } = await admin
      .from('events')
      .select('id')
      .eq('organization_id', input.organizationId)
      .contains('metadata', {
        provider_message_id: input.providerMessageId.trim(),
      })
      .limit(1)
      .maybeSingle();

    if (duplicate?.id) {
      return { matched: true, leadId: null as string | null, duplicate: true };
    }
  }

  const { data: candidates, error: candidatesError } = await admin
    .from('crm_leads')
    .select('id, name, phone, status')
    .eq('organization_id', input.organizationId)
    .not('phone', 'is', null)
    .limit(1000);

  if (candidatesError) throw candidatesError;

  const lead =
    (candidates ?? []).find((item) => normalizePhone(item.phone) === fromDigits) ??
    (candidates ?? []).find(
      (item) =>
        comparableFrom.length >= 7 &&
        comparablePhone(item.phone) === comparableFrom,
    ) ??
    null;

  if (!lead) {
    return { matched: false, leadId: null as string | null };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await admin
    .from('crm_leads')
    .update({
      status: lead.status === 'new' ? 'contacted' : lead.status,
      last_contact_at: now,
    })
    .eq('organization_id', input.organizationId)
    .eq('id', lead.id);

  if (updateError) throw updateError;

  const type =
    input.channel === 'whatsapp'
      ? 'crm_whatsapp_received'
      : 'crm_sms_received';

  const { error: eventError } = await admin.from('events').insert({
    organization_id: input.organizationId,
    type,
    source: input.channel === 'whatsapp' ? 'evolution-go' : 'httpsms',
    actor_type: 'external',
    actor_id: null,
    payload: {
      lead_id: lead.id,
      from: input.from,
      text: input.text.trim(),
      provider_timestamp: input.providerTimestamp ?? null,
      ...(input.raw ? { raw: input.raw } : {}),
    },
    metadata: {
      crm_lead_id: lead.id,
      provider_message_id: input.providerMessageId ?? null,
      channel: input.channel,
    },
    correlation_id: lead.id,
    created_at: now,
  });

  if (eventError) throw eventError;

  return {
    matched: true,
    leadId: lead.id as string,
    duplicate: false,
  };
}
