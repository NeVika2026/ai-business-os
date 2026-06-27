import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { createClient } from '@/services/supabase/server';
import { ensureUserOnboarding, getDashboardContext } from '@/utils/auth/onboarding';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  await ensureUserOnboarding(supabase);

  const context = await getDashboardContext(supabase);

  if (!context) {
    redirect('/login');
  }

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '/dashboard';

  return (
    <AppShell
      pathname={pathname}
      email={context.email}
      organizationName={context.organizationName}
      header={<Header pathname={pathname} email={context.email} />}
    >
      {children}
    </AppShell>
  );
}
