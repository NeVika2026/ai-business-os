import { redirect } from 'next/navigation';

import { createClient } from '@/services/supabase/server';
import { getDashboardContext, type DashboardContext } from '@/utils/auth/onboarding';

export async function requireOrganizationAdmin(): Promise<DashboardContext> {
  const supabase = await createClient();
  const context = await getDashboardContext(supabase);

  if (!context) {
    redirect('/login/sign-in');
  }

  if (context.role === 'member') {
    redirect('/home?notice=admin_required');
  }

  return context;
}
