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
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-5 py-5 sm:px-6">
      {welcome.previousWorkLabel && welcome.previousWorkLeadIn ? (
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {welcome.previousWorkLeadIn}{' '}
          <span className="font-medium text-[var(--text-primary)]">{welcome.previousWorkLabel}</span>
          .
        </p>
      ) : null}

      {welcome.recommendationLabel ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
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
