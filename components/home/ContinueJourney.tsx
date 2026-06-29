import Link from 'next/link';

import type { ContinueJourney as ContinueJourneyData } from '@/utils/home/concierge-mappers';

const SECTION_TITLE = 'Continue where you left off';
const SUPPORTING_LINE = 'This is the fastest way back to progress.';

type ContinueJourneyProps = {
  journey: ContinueJourneyData;
};

export function ContinueJourney({ journey }: ContinueJourneyProps) {
  return (
    <section
      className="rounded-3xl border border-[var(--accent)]/25 bg-[var(--surface-1)] p-6 shadow-sm"
      aria-labelledby="continue-journey-heading"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">In progress</p>

      <h2
        id="continue-journey-heading"
        className="mt-2 text-lg font-semibold text-[var(--text-primary)] sm:text-xl"
      >
        {SECTION_TITLE}
      </h2>

      <p className="mt-2 text-sm text-[var(--text-secondary)]">{journey.description}</p>

      <p className="mt-1 text-sm text-[var(--text-secondary)]">{SUPPORTING_LINE}</p>

      <Link
        href={journey.resumeHref}
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:w-auto"
      >
        {journey.resumeLabel}
      </Link>
    </section>
  );
}
