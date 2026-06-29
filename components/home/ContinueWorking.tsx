import Link from 'next/link';

import type { ContinueWorkingData } from '@/utils/home/home-types';

type ContinueWorkingProps = {
  data: ContinueWorkingData;
};

export function ContinueWorking({ data }: ContinueWorkingProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Continue working</h2>
      </header>

      <div className="space-y-3">
        {data.runningExecution ? (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
              Running execution
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {data.runningExecution.label}
            </p>
            <p className="text-xs capitalize text-[var(--text-secondary)]">
              {data.runningExecution.status}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">No running executions right now.</p>
        )}

        {data.lastProject ? (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
              Last project
            </p>
            <Link
              href={data.lastProject.href}
              className="mt-1 text-sm font-medium text-[var(--accent)]"
            >
              {data.lastProject.name}
            </Link>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">No projects yet.</p>
        )}

        {data.resumeHref ? (
          <Link
            href={data.resumeHref}
            className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            {data.resumeLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
