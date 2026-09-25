import Link from 'next/link';

import { DemoModeToggle } from '@/components/demo/DemoModeToggle';
import { IntegrationsDashboard } from '@/components/platform/IntegrationsDashboard';
import { PublishingDiagnostics } from '@/components/platform/PublishingDiagnostics';
import { requireOrganizationAdmin } from '@/utils/auth/authorization';
import { resolveIntegrationStatuses } from '@/utils/platform/integration-catalog';

export default async function SettingsPage() {
  await requireOrganizationAdmin();
  const integrations = resolveIntegrationStatuses(process.env);
  const configuredPublishingChannels = [
    ['telegram-publish', 'telegram'],
    ['vk-publish', 'vk'],
    ['youtube-publish', 'youtube'],
    ['instagram-publish', 'instagram'],
    ['tiktok-publish', 'tiktok'],
    ['max-publish', 'max'],
  ]
    .filter(([integrationId]) =>
      integrations.some(
        (item) => item.id === integrationId && item.status === 'connected',
      ),
    )
    .map(([, channel]) => channel as 'telegram' | 'vk' | 'youtube' | 'instagram' | 'tiktok' | 'max');

  return (
    <div className="space-y-8">
      <section className="mx-auto w-full max-w-6xl">
        <Link
          href="/settings/team"
          className="flex items-center justify-between gap-4 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 transition hover:border-[var(--accent)]/30"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[.14em] text-[var(--accent)]">
              Команда и доступ
            </p>
            <h2 className="mt-2 text-xl font-black text-[var(--text-primary)]">
              Управление участниками
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Приглашения, роли администратора и участника, удаление доступа.
            </p>
          </div>
          <span className="text-2xl text-[var(--accent)]">→</span>
        </Link>
      </section>

      <IntegrationsDashboard integrations={integrations} />

      <PublishingDiagnostics configured={configuredPublishingChannels} />

      <section className="mx-auto w-full max-w-6xl">
        <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 sm:px-8">
          <DemoModeToggle />
        </div>
      </section>
    </div>
  );
}
