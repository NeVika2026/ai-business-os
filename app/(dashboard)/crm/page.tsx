import { redirect } from 'next/navigation';

import { LeadTable } from '@/components/crm/lead-table';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { mapCrmLeads } from '@/utils/crm/leads';

export default async function CrmPage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const { data: leads, error } = await supabase
    .from('crm_leads')
    .select(
      `
        id,
        organization_id,
        name,
        phone,
        email,
        status,
        source,
        notes,
        assigned_to,
        created_at,
        assignee:assigned_to (
          full_name
        )
      `,
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return <LeadTable leads={mapCrmLeads(leads ?? [])} />;
}
