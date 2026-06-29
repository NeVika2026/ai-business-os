import { redirect } from 'next/navigation';

import { AIConcierge } from '@/components/home/AIConcierge';
import { TodayFallback } from '@/components/home/TodayFallback';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadHomePageConcierge } from '@/utils/home/concierge-loader';

export default async function HomePage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const result = await loadHomePageConcierge(supabase, organizationId);

  if (result.status === 'unauthorized') {
    redirect('/login');
  }

  if (result.status === 'fallback') {
    return <TodayFallback />;
  }

  return <AIConcierge data={result.data} />;
}
