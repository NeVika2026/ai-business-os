import { redirect } from 'next/navigation';

import { createClient } from '@/services/supabase/server';
import { ensureUserOnboarding, getDashboardContext } from '@/utils/auth/onboarding';

import { logout } from './actions';

export default async function DashboardPage() {
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

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Добро пожаловать, {context.email}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Organization: {context.organizationName}
        </p>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-primary)]"
        >
          Logout
        </button>
      </form>
    </main>
  );
}
