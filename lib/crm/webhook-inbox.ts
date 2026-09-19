import { createClient } from '@supabase/supabase-js';

type InboundChannel = 'whatsapp' | 'sms';

type RecordInboundInput = {
  organizationId: string;
  channel: InboundChannel;
  phone: string;
  text: string;
  provider: string;
  providerEventId: string;
  senderName?: string | null;
  metadata?: Record<string, unknown>;
};

function getAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Inbound CRM webhooks require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function normalizeContactPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

async function completeOpenFollowUps(input: {
  supabase: ReturnType<typeof getAdminClient>;
  organizationId: string;
  leadId: string;
}) {
  const marker = 'CRM_LEAD_ID:' + input.leadId;

  const { data: tasks } = await input.supabase
    .from('tasks')
    .select('id')
    .eq('organization_id', input.organizationId)
    .eq('status', 'todo')
    .ilike('description', '%' + marker + '%');

  const ids = (tasks ?? []).map((task) => task.id);
  if (!ids.length) return;

  await input.supabase
    .from('tasks')
    .update({ status: 'done' })
    .in('id', ids)
    .eq('organization_id', input.organizationId);
}

export async function recordInboundCommunication(input: RecordInboundInput) {
  const supabase = getAdminClient();
  const phoneKey = normalizeContactPhone(input.phone);

  if (!phoneKey) {
    throw new Error('Inbound message does not contain a valid phone number.');
  }

  const { data: existingEvent } = await supabase
    .from('events')
    .select('id')
    .eq('organization_id', input.organizationId)
    .contains('metadata', {
      provider_event_id: input.providerEventId,
      provider: input.provider,
    })
    .maybeSingle();

  if (existingEvent?.id) {
    return {
      duplicate: true,
      matched: false,
      leadId: null as string | null,
    };
  }

  const { data: leads, error: leadsError } = await supabase
    .from('crm_leads')
    .select('id, phone, status')
    .eq('organization_id', input.organizationId)
    .not('phone', 'is', null)
    .limit(5000);

  if (leadsError) throw leadsError;

  const lead =
    (leads ?? []).find(
      (candidate) => normalizeContactPhone(candidate.phone ?? '') === phoneKey,
    ) ?? null;

  const eventType =
    input.channel === 'whatsapp'
      ? lead
        ? 'crm_whatsapp_received'
        : 'crm_whatsapp_received_unmatched'
      : lead
        ? 'crm_sms_received'
        : 'crm_sms_received_unmatched';

  const receivedAt = new Date().toISOString();

  const { error: eventError } = await supabase.from('events').insert({
    organization_id: input.organizationId,
    type: eventType,
    source: input.provider,
    actor_type: 'external',
    actor_id: null,
    payload: {
      lead_id: lead?.id ?? null,
      phone: input.phone,
      text: input.text,
      sender_name: input.senderName ?? null,
      channel: input.channel,
      ...input.metadata,
    },
    metadata: {
      provider: input.provider,
      provider_event_id: input.providerEventId,
      crm_lead_id: lead?.id ?? null,
      phone_key: phoneKey,
    },
    correlation_id: lead?.id ?? null,
  });

  if (eventError) throw eventError;

  if (lead) {
    const { error: leadUpdateError } = await supabase
      .from('crm_leads')
      .update({
        status: lead.status === 'new' ? 'contacted' : lead.status,
        last_contact_at: receivedAt,
      })
      .eq('organization_id', input.organizationId)
      .eq('id', lead.id);

    if (leadUpdateError) throw leadUpdateError;

    await completeOpenFollowUps({
      supabase,
      organizationId: input.organizationId,
      leadId: lead.id,
    });
  }

  return {
    duplicate: false,
    matched: Boolean(lead),
    leadId: lead?.id ?? null,
  };
}
