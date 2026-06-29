import { formatProjectDate } from '@/utils/projects/project-mappers';
import type { ProjectOverview } from '@/utils/projects/project-types';

type ProjectOverviewProps = {
  overview: ProjectOverview;
};

export function ProjectOverview({ overview }: ProjectOverviewProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Overview</h2>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
              Description
            </p>
            <p className="mt-1 text-sm text-[var(--text-primary)]">
              {overview.description?.trim() || 'No description yet.'}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Progress</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${overview.progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {overview.progressPercent}% execution success
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Latest execution" value={overview.latestExecution?.label ?? '—'} />
          <Metric label="Latest activity" value={overview.latestActivity?.title ?? '—'} />
          <Metric label="Created" value={formatProjectDate(overview.createdAt)} />
          <Metric label="Updated" value={formatProjectDate(overview.updatedAt)} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
