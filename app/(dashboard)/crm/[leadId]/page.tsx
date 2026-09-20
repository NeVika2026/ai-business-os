import { notFound } from 'next/navigation';

import { CrmLeadDetail } from '@/components/crm/CrmLeadDetail';
import { createClient } from '@/services/supabase/server';
import type { LeadStatus } from '@/types/crm';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

type LeadPageProps = {
  params: Promise<{ leadId: string }>;
};

export default async function LeadPage({ params }: LeadPageProps) {
  const { leadId } = await params;
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) notFound();

  const { data: lead } = await supabase
    .from('crm_leads')
    .select(
      'id, project_id, name, email, phone, status, source, notes, last_contact_at, created_at',
    )
    .eq('organization_id', organizationId)
    .eq('id', leadId)
    .maybeSingle();

  if (!lead) notFound();

  const [{ data: events }, { data: tasks }] = await Promise.all([
    supabase
      .from('events')
      .select('id, type, payload, created_at')
      .eq('organization_id', organizationId)
      .eq('correlation_id', leadId)
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('tasks')
      .select('id, due_at, description')
      .eq('organization_id', organizationId)
      .eq('status', 'todo')
      .like('description', 'CRM\\_LEAD\\_ID:' + leadId + '\n%')
      .order('due_at', { ascending: true })
      .limit(1),
  ]);

  const timeline = (events ?? []).map((event) => ({
    id: event.id,
    type: event.type,
    payload: (event.payload ?? {}) as Record<string, unknown>,
    createdAt: event.created_at,
  }));

  return (
    <CrmLeadDetail
      lead={{
        id: lead.id,
        projectId: lead.project_id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status as LeadStatus,
        source: lead.source,
        notes: lead.notes,
        lastContactAt: lead.last_contact_at,
        createdAt: lead.created_at,
      }}
      timeline={timeline}
      nextFollowUp={
        tasks?.[0]?.due_at
          ? { id: tasks[0].id, dueAt: tasks[0].due_at, description: tasks[0].description }
          : null
      }
    />
  );
}
