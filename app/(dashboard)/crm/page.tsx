import { CrmPipeline } from '@/components/crm/CrmPipeline';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import type { CrmLead, LeadStatus } from '@/types/crm';

function getThirtyDaysAgoIso() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

function getReferenceNowIso() {
  return new Date().toISOString();
}

export default async function CrmPage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return (
      <CrmPipeline
        leads={[]}
        followUpsByLead={{}}
        latestRepliesByLead={{}}
        referenceNow={getReferenceNowIso()}
      />
    );
  }

  const { data } = await supabase
    .from('crm_leads')
    .select('id, organization_id, name, email, phone, status, source, notes, assigned_to, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  const { data: followUpTasks } = await supabase
    .from('tasks')
    .select('id, description, due_at')
    .eq('organization_id', organizationId)
    .eq('status', 'todo')
    .not('due_at', 'is', null)
    .order('due_at', { ascending: true });

  const thirtyDaysAgo = getThirtyDaysAgoIso();
  const referenceNow = getReferenceNowIso();
  const { data: communicationEvents } = await supabase
    .from('events')
    .select('correlation_id, type, payload, created_at')
    .eq('organization_id', organizationId)
    .in('type', [
      'crm_whatsapp_received',
      'crm_sms_received',
      'crm_whatsapp_sent',
      'crm_sms_sent',
      'crm_voice_call_completed',
    ])
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(500);

  const followUpsByLead: Record<string, string> = {};
  for (const task of followUpTasks ?? []) {
    const description = task.description ?? '';
    const match = description.match(/CRM_LEAD_ID:([0-9a-f-]{36})/i);
    if (!match || !task.due_at || followUpsByLead[match[1]]) continue;
    followUpsByLead[match[1]] = task.due_at;
  }

  const latestRepliesByLead: Record<
    string,
    { at: string; text: string; channel: 'whatsapp' | 'sms'; needsReply: boolean }
  > = {};

  const latestCommunicationByLead = new Set<string>();

  for (const event of communicationEvents ?? []) {
    const leadId = event.correlation_id;
    if (!leadId || latestCommunicationByLead.has(leadId)) continue;

    latestCommunicationByLead.add(leadId);

    const isInbound =
      event.type === 'crm_whatsapp_received' ||
      event.type === 'crm_sms_received';

    if (!isInbound) continue;

    const payload = (event.payload ?? {}) as Record<string, unknown>;
    latestRepliesByLead[leadId] = {
      at: event.created_at,
      text: typeof payload.text === 'string' ? payload.text : '',
      channel: event.type === 'crm_sms_received' ? 'sms' : 'whatsapp',
      needsReply: true,
    };
  }

  const leads: CrmLead[] = (data ?? []).map((lead) => ({
    id: lead.id,
    organization_id: lead.organization_id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    status: lead.status as LeadStatus,
    source: lead.source,
    notes: lead.notes,
    assigned_to: lead.assigned_to,
    created_at: lead.created_at,
    assignee: null,
  }));

  return (
    <CrmPipeline
      leads={leads}
      followUpsByLead={followUpsByLead}
      latestRepliesByLead={latestRepliesByLead}
      referenceNow={referenceNow}
    />
  );
}
