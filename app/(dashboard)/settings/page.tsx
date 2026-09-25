import { DemoModeToggle } from '@/components/demo/DemoModeToggle';
import { IntegrationsDashboard } from '@/components/platform/IntegrationsDashboard';
import { requireOrganizationAdmin } from '@/utils/auth/authorization';
import { resolveIntegrationStatuses } from '@/utils/platform/integration-catalog';

export default async function SettingsPage() {
  await requireOrganizationAdmin();
  const integrations = resolveIntegrationStatuses(process.env);

  return (
    <div className="space-y-8">
      <IntegrationsDashboard integrations={integrations} />

      <section className="mx-auto w-full max-w-6xl">
        <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 sm:px-8">
          <DemoModeToggle />
        </div>
      </section>
    </div>
  );
}
