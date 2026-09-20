import type { SupabaseClient } from '@supabase/supabase-js';

import { normalizeContactPhone } from '@/lib/crm/inbox-conversations';

export type CrmDuplicateReason = 'email' | 'phone';

export type CrmDuplicateCandidate = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  reasons: CrmDuplicateReason[];
};

export function normalizeContactEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

export async function findCrmDuplicateCandidates(input: {
  supabase: SupabaseClient;
  organizationId: string;
  email?: string | null;
  phone?: string | null;
  excludeLeadId?: string | null;
  limit?: number;
}) {
  const emailKey = normalizeContactEmail(input.email);
  const phoneKey = normalizeContactPhone(input.phone ?? '');
  if (!emailKey && !phoneKey) return [] as CrmDuplicateCandidate[];

  const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
  const matches: CrmDuplicateCandidate[] = [];
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await input.supabase
      .from('crm_leads')
      .select('id, name, email, phone')
      .eq('organization_id', input.organizationId)
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    for (const lead of data ?? []) {
      if (lead.id === input.excludeLeadId) continue;

      const reasons: CrmDuplicateReason[] = [];
      if (emailKey && normalizeContactEmail(lead.email) === emailKey) reasons.push('email');
      if (phoneKey && normalizeContactPhone(lead.phone ?? '') === phoneKey) reasons.push('phone');

      if (reasons.length) {
        matches.push({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          reasons,
        });
        if (matches.length >= limit) return matches;
      }
    }

    if ((data?.length ?? 0) < pageSize) break;
  }

  return matches;
}
