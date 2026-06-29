import { redirect } from 'next/navigation';

import { AdaptiveHome } from '@/components/home/AdaptiveHome';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadHomeData } from '@/utils/home/home-loader';

export default async function HomePage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const data = await loadHomeData(supabase, organizationId);

  if (!data) {
    redirect('/login');
  }

  return <AdaptiveHome data={data} />;
}
