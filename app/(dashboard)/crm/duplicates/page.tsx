import { CrmDuplicates } from '@/components/crm/CrmDuplicates';
import { createClient } from '@/services/supabase/server';
import { requireOrganizationAdmin } from '@/utils/auth/authorization';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

type DuplicateLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  createdAt: string;
};

function normalizeEmail(value: string | null) {
  return value?.trim().toLowerCase() || '';
}

function normalizePhone(value: string | null) {
  return value?.replace(/\D/g, '') || '';
}

export default async function CrmDuplicatesPage() {
  await requireOrganizationAdmin();
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) return <CrmDuplicates groups={[]} />;

  const { data } = await supabase
    .from('crm_leads')
    .select('id, name, email, phone, source, status, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  const leads: DuplicateLead[] = (data ?? []).map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    status: lead.status,
    createdAt: lead.created_at,
  }));

  const emailMap = new Map<string, DuplicateLead[]>();
  const phoneMap = new Map<string, DuplicateLead[]>();

  for (const lead of leads) {
    const email = normalizeEmail(lead.email);
    if (email) {
      const current = emailMap.get(email) ?? [];
      current.push(lead);
      emailMap.set(email, current);
    }

    const phone = normalizePhone(lead.phone);
    if (phone.length >= 8) {
      const current = phoneMap.get(phone) ?? [];
      current.push(lead);
      phoneMap.set(phone, current);
    }
  }

  const groups = [
    ...[...emailMap.entries()]
      .filter(([, items]) => items.length > 1)
      .map(([value, items]) => ({
        key: 'email:' + value,
        kind: 'email' as const,
        value,
        leads: items,
      })),
    ...[...phoneMap.entries()]
      .filter(([, items]) => items.length > 1)
      .map(([value, items]) => ({
        key: 'phone:' + value,
        kind: 'phone' as const,
        value,
        leads: items,
      })),
  ].sort((a, b) => b.leads.length - a.leads.length);

  return <CrmDuplicates groups={groups} />;
}
