import { redirect } from 'next/navigation';

import { OsaHomeActionScreen } from '@/components/home/OsaHomeActionScreen';
import { TodayFallback } from '@/components/home/TodayFallback';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadHomeUserContext } from '@/utils/home/home-loader';

export default async function HomePage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const context = await loadHomeUserContext(supabase);

  if (!context) {
    return <TodayFallback />;
  }

  return <OsaHomeActionScreen organizationName={context.organizationName} />;
}
