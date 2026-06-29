'use client';

import type { PersonalWelcomeData } from '@/utils/home/wow-engine';

type PersonalWelcomeProps = {
  welcome: PersonalWelcomeData;
};

export function PersonalWelcome({ welcome }: PersonalWelcomeProps) {
  if (!welcome.show) {
    return null;
  }

  return (
    <section className="wow-fade-in wow-delay-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4 sm:px-5">
      {welcome.previousWorkLabel && welcome.previousWorkLeadIn ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {welcome.previousWorkLeadIn}{' '}
          <span className="font-medium text-[var(--text-primary)]">{welcome.previousWorkLabel}</span>
          .
        </p>
      ) : null}

      {welcome.recommendationLabel ? (
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Today I&apos;d recommend continuing{' '}
          <span className="font-medium text-[var(--text-primary)]">
            {welcome.recommendationLabel}
          </span>
          .
        </p>
      ) : null}
    </section>
  );
}
