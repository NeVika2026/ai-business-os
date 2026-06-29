import Link from 'next/link';

import type { ContinueJourney as ContinueJourneyData } from '@/utils/home/concierge-mappers';

type ContinueJourneyProps = {
  journey: ContinueJourneyData;
};

export function ContinueJourney({ journey }: ContinueJourneyProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Continue previous work</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{journey.description}</p>
      <Link
        href={journey.resumeHref}
        className="mt-4 inline-flex rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
      >
        {journey.resumeLabel}
      </Link>
    </section>
  );
}
