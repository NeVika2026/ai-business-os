import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { mapRunsToHistory } from '@/utils/cabinet/dashboard-mappers';
import { loadCabinetExecutionHistory } from '@/utils/cabinet/load-dashboard';
import { formatDateTime } from '@/utils/orchestrator/runs';

export default async function HistoryPage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const runs = await loadCabinetExecutionHistory(supabase, organizationId);
  const history = mapRunsToHistory(runs);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">History</p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">Your history</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Everything the platform has done for you
        </p>
      </header>

      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
          No results yet.
        </div>
      ) : (
        <ol className="space-y-3">
          {history.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={item.href}
                    className="text-base font-semibold text-[var(--text-primary)] hover:underline"
                  >
                    {item.label}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {item.mode} · {item.statusLabel} · {item.duration}
                  </p>
                </div>
                <time className="text-xs text-[var(--text-secondary)]">
                  {formatDateTime(item.timestamp)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
