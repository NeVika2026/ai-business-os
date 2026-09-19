import { CrmPipeline } from '@/components/crm/CrmPipeline';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import type { CrmLead } from '@/types/crm';

export default async function CrmPage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return <CrmPipeline leads={[]} />;
  }

  const { data } = await supabase
    .from('crm_leads')
    .select('id, organization_id, name, email, phone, status, source, notes, assigned_to, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  const leads: CrmLead[] = (data ?? []).map((lead) => ({
    id: lead.id,
    organization_id: lead.organization_id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    status: lead.status,
    source: lead.source,
    notes: lead.notes,
    assigned_to: lead.assigned_to,
    created_at: lead.created_at,
    assignee: null,
  }));

  return <CrmPipeline leads={leads} />;
}
