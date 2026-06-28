import { DashboardOverview } from '@/components/cabinet/DashboardOverview';
import { createClient } from '@/services/supabase/server';
import { getDashboardContext } from '@/utils/auth/onboarding';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadCabinetDashboard } from '@/utils/cabinet/load-dashboard';
import { redirect } from 'next/navigation';

export default async function CabinetPage() {
  const supabase = await createClient();
  const context = await getDashboardContext(supabase);

  if (!context) {
    redirect('/login');
  }

  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const dashboard = await loadCabinetDashboard(supabase, organizationId, context.email);

  return <DashboardOverview dashboard={dashboard} />;
}
