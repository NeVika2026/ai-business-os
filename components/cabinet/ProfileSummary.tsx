import type { ProfileSummaryData } from '@/utils/cabinet/dashboard-mappers';
import { formatDateTime } from '@/utils/orchestrator/runs';

type ProfileSummaryProps = {
  profile: ProfileSummaryData;
};

export function ProfileSummary({ profile }: ProfileSummaryProps) {
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
          {(profile.email[0] ?? '?').toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{profile.email}</p>
          <p className="truncate text-xs text-[var(--text-secondary)]">
            {profile.organizationName}
          </p>
        </div>
      </div>

      <dl className="mt-4 space-y-2 border-t border-[var(--border-subtle)] pt-4">
        <div className="flex items-center justify-between gap-2 text-sm">
          <dt className="text-[var(--text-secondary)]">Organization</dt>
          <dd className="font-medium text-[var(--text-primary)]">{profile.organizationName}</dd>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <dt className="text-[var(--text-secondary)]">Subscription</dt>
          <dd className="font-medium text-[var(--text-primary)]">{profile.subscription}</dd>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <dt className="text-[var(--text-secondary)]">Workspaces</dt>
          <dd className="font-medium text-[var(--text-primary)]">{profile.workspaceCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <dt className="text-[var(--text-secondary)]">Projects</dt>
          <dd className="font-medium text-[var(--text-primary)]">{profile.projectCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <dt className="text-[var(--text-secondary)]">AI agents</dt>
          <dd className="font-medium text-[var(--text-primary)]">{profile.agentCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <dt className="text-[var(--text-secondary)]">Executions</dt>
          <dd className="font-medium text-[var(--text-primary)]">{profile.executionCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <dt className="text-[var(--text-secondary)]">Created</dt>
          <dd className="font-medium text-[var(--text-primary)]">
            {profile.createdAt ? formatDateTime(profile.createdAt) : '—'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
