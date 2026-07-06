import { redirect } from 'next/navigation';

import { MissionControlPage } from '@/components/mission-control/MissionControlPage';
import { TodayFallback } from '@/components/home/TodayFallback';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadMissionControlPageData } from '@/utils/mission-control/mission-control-loader';

export default async function MissionControlRoute() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const result = await loadMissionControlPageData(supabase, organizationId);

  if (result.status === 'unauthorized') {
    redirect('/login');
  }

  if (result.status === 'fallback') {
    return <TodayFallback />;
  }

  return <MissionControlPage data={result.data} />;
}
