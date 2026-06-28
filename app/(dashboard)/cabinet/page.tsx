import { DashboardOverview } from '@/components/cabinet/DashboardOverview';
import { createClient } from '@/services/supabase/server';
import { getDashboardContext } from '@/utils/auth/onboarding';

export default async function CabinetPage() {
  const supabase = await createClient();
  const context = await getDashboardContext(supabase);

  return <DashboardOverview email={context?.email} organizationName={context?.organizationName} />;
}
