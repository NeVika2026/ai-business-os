import { createClient } from '@/services/supabase/server';
import { getDashboardContext } from '@/utils/auth/onboarding';

export default async function DashboardPage() {
  const supabase = await createClient();
  const context = await getDashboardContext(supabase);

  return (
    <section className="mx-auto max-w-3xl space-y-2">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        Добро пожаловать, {context?.email}
      </h1>
      <p className="text-sm text-[var(--text-secondary)]">
        Organization: {context?.organizationName}
      </p>
    </section>
  );
}
