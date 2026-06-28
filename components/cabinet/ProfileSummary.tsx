import { PROFILE_METRICS } from '@/utils/cabinet/cabinet-config';

export type ProfileSummaryProps = {
  email?: string | null;
  organizationName?: string | null;
};

export function ProfileSummary({ email, organizationName }: ProfileSummaryProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">Profile</p>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Personal Cabinet</h2>
      </header>

      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-lg font-semibold text-[var(--accent)]"
        >
          {(email?.[0] ?? '?').toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{email ?? '—'}</p>
          <p className="truncate text-xs text-[var(--text-secondary)]">{organizationName ?? '—'}</p>
        </div>
      </div>

      <dl className="mt-4 space-y-2 border-t border-[var(--border-subtle)] pt-4">
        <div className="flex items-center justify-between gap-2 text-sm">
          <dt className="text-[var(--text-secondary)]">Subscription</dt>
          <dd className="font-medium text-[var(--text-primary)]">—</dd>
        </div>
        {PROFILE_METRICS.map((metric) => (
          <div key={metric.id} className="flex items-center justify-between gap-2 text-sm">
            <dt className="text-[var(--text-secondary)]">{metric.label}</dt>
            <dd className="font-medium text-[var(--text-primary)]">—</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
