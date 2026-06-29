import Link from 'next/link';

import type { ResultData, ResultStatusLabel } from '@/utils/results/result-mappers';

const STATUS_STYLES: Record<ResultStatusLabel, string> = {
  Completed: 'bg-emerald-500/15 text-emerald-300',
  'In progress': 'bg-sky-500/15 text-sky-300',
  Preparing: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  'Needs attention': 'bg-red-500/15 text-red-300',
};

type ResultHeaderProps = {
  result: Pick<
    ResultData,
    'title' | 'createdAt' | 'status' | 'projectName' | 'projectHref' | 'duration' | 'presentationHeadline'
  >;
};

export function ResultHeader({ result }: ResultHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">Result</p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            {result.presentationHeadline}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{result.title}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[result.status]}`}
        >
          {result.status}
        </span>
      </div>

      <dl className="grid gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-sm text-[var(--text-secondary)]">Created</dt>
          <dd className="mt-1 text-[var(--text-primary)]">{result.createdAt}</dd>
        </div>
        <div>
          <dt className="text-sm text-[var(--text-secondary)]">Status</dt>
          <dd className="mt-1 text-[var(--text-primary)]">{result.status}</dd>
        </div>
        <div>
          <dt className="text-sm text-[var(--text-secondary)]">Project</dt>
          <dd className="mt-1">
            {result.projectHref && result.projectName ? (
              <Link href={result.projectHref} className="text-[var(--accent)] hover:underline">
                {result.projectName}
              </Link>
            ) : (
              <span className="text-[var(--text-primary)]">—</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-[var(--text-secondary)]">Duration</dt>
          <dd className="mt-1 text-[var(--text-primary)]">{result.duration}</dd>
        </div>
      </dl>
    </header>
  );
}
