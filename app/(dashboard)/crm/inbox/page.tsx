import { CrmInbox } from '@/components/crm/CrmInbox';
import { followUpLeadId } from '@/lib/crm/follow-ups';
import { groupUnmatchedInbound } from '@/lib/crm/inbox-conversations';
import { loadInboundClaims } from '@/services/crm/claim-inbound';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

export default async function CrmInboxPage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return <CrmInbox replies={[]} followUps={[]} unmatched={[]} />;
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: leads }, { data: events }, { data: tasks }] = await Promise.all([
    supabase
      .from('crm_leads')
      .select('id, name, phone, project_id')
      .eq('organization_id', organizationId),
    supabase
      .from('events')
      .select('id, correlation_id, type, payload, metadata, created_at')
      .eq('organization_id', organizationId)
      .in('type', [
        'crm_whatsapp_received',
        'crm_sms_received',
        'crm_whatsapp_sent',
        'crm_sms_sent',
        'crm_voice_call_completed',
        'crm_whatsapp_received_unmatched',
        'crm_sms_received_unmatched',
      ])
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(800),
    supabase
      .from('tasks')
      .select('id, description, due_at')
      .eq('organization_id', organizationId)
      .eq('status', 'todo')
      .not('due_at', 'is', null)
      .order('due_at', { ascending: true })
      .limit(300),
  ]);

  const leadById = new Map(
    (leads ?? []).map((lead) => [
      lead.id,
      {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        projectId: lead.project_id,
      },
    ]),
  );

  const inboundClaims = await loadInboundClaims(
    supabase,
    organizationId,
    (events ?? [])
      .filter((event) =>
        event.type === 'crm_whatsapp_received_unmatched' ||
        event.type === 'crm_sms_received_unmatched',
      )
      .map((event) => event.id),
  );
  const claimedOriginalEventIds = new Set(inboundClaims.map((claim) => claim.originalId));

  const unmatched = (events ?? [])
    .filter(
      (event) =>
        (event.type === 'crm_whatsapp_received_unmatched' ||
          event.type === 'crm_sms_received_unmatched') &&
        !claimedOriginalEventIds.has(event.id),
    )
    .map((event) => {
      const payload = (event.payload ?? {}) as Record<string, unknown>;
      const metadata = (event.metadata ?? {}) as Record<string, unknown>;
      const candidateIds = Array.isArray(metadata.duplicate_candidate_ids)
        ? metadata.duplicate_candidate_ids.filter(
            (value): value is string => typeof value === 'string',
          )
        : [];

      return {
        eventId: event.id,
        channel:
          event.type === 'crm_sms_received_unmatched'
            ? ('sms' as const)
            : ('whatsapp' as const),
        phone: typeof payload.phone === 'string' ? payload.phone : '',
        senderName:
          typeof payload.sender_name === 'string'
            ? payload.sender_name
            : null,
        text: typeof payload.text === 'string' ? payload.text : '',
        at: event.created_at,
        ambiguousDuplicateContact: metadata.ambiguous_duplicate_contact === true,
        duplicateCandidateIds: candidateIds,
      };
    });

  const latestCommunicationSeen = new Set<string>();
  const replies: Array<{
    leadId: string;
    leadName: string;
    phone: string | null;
    projectId: string | null;
    channel: 'whatsapp' | 'sms';
    text: string;
    at: string;
  }> = [];

  for (const event of events ?? []) {
    const leadId = event.correlation_id;
    if (!leadId || latestCommunicationSeen.has(leadId)) continue;

    latestCommunicationSeen.add(leadId);

    if (
      event.type !== 'crm_whatsapp_received' &&
      event.type !== 'crm_sms_received'
    ) {
      continue;
    }

    const lead = leadById.get(leadId);
    if (!lead) continue;

    const payload = (event.payload ?? {}) as Record<string, unknown>;
    replies.push({
      leadId,
      leadName: lead.name,
      phone: lead.phone,
      projectId: lead.projectId,
      channel: event.type === 'crm_sms_received' ? 'sms' : 'whatsapp',
      text: typeof payload.text === 'string' ? payload.text : '',
      at: event.created_at,
    });
  }

  const followUps: Array<{
    taskId: string;
    description: string | null;
    leadId: string;
    leadName: string;
    phone: string | null;
    projectId: string | null;
    dueAt: string;
    overdue: boolean;
  }> = [];

  for (const task of tasks ?? []) {
    const leadId = followUpLeadId(task.description);
    if (!leadId || !task.due_at) continue;

    const lead = leadById.get(leadId);
    if (!lead) continue;

    followUps.push({
      taskId: task.id,
      description: task.description,
      leadId,
      leadName: lead.name,
      phone: lead.phone,
      projectId: lead.projectId,
      dueAt: task.due_at,
      overdue: new Date(task.due_at).getTime() <= now.getTime(),
    });
  }

  return <CrmInbox replies={replies} followUps={followUps} unmatched={groupUnmatchedInbound(unmatched)} />;
}
