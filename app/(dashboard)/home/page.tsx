import { redirect } from 'next/navigation';

import { AIConcierge } from '@/components/home/AIConcierge';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadConciergeData } from '@/utils/home/concierge-loader';

export default async function HomePage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const data = await loadConciergeData(supabase, organizationId);

  if (!data) {
    redirect('/login');
  }

  return <AIConcierge data={data} />;
}
