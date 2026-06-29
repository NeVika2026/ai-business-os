import Link from 'next/link';

import type { ContinueJourney as ContinueJourneyData } from '@/utils/home/concierge-mappers';

type ContinueJourneyProps = {
  journey: ContinueJourneyData;
};

export function ContinueJourney({ journey }: ContinueJourneyProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Continue journey</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Resume previous unfinished work</p>
      </header>

      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">{journey.title}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{journey.description}</p>
        </div>

        {journey.runningExecutionLabel ? (
          <p className="text-xs text-[var(--text-secondary)]">
            Running: {journey.runningExecutionLabel}
          </p>
        ) : null}

        {journey.projectName ? (
          <p className="text-xs text-[var(--text-secondary)]">Project: {journey.projectName}</p>
        ) : null}

        <Link
          href={journey.resumeHref}
          className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          {journey.resumeLabel}
        </Link>
      </div>
    </section>
  );
}
