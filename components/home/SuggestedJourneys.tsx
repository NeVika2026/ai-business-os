'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { startGoalHandoff } from '@/app/(dashboard)/home/actions';
import type { SuggestedJourney } from '@/utils/home/concierge-mappers';
import { isHomeGoalId } from '@/utils/home/home-mappers';

type SuggestedJourneysProps = {
  journeys: SuggestedJourney[];
};

export function SuggestedJourneys({ journeys }: SuggestedJourneysProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleJourney(journey: SuggestedJourney) {
    if (!journey.goalId) {
      router.push(journey.href);
      return;
    }

    if (!isHomeGoalId(journey.goalId)) {
      return;
    }

    setLoadingId(journey.id);
    const result = await startGoalHandoff(journey.goalId);

    if (result.status === 'ok') {
      router.push(result.url);
      return;
    }

    setLoadingId(null);
    router.push(journey.href);
  }

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Suggested journeys</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Based on your recent history</p>
      </header>

      <ul className="space-y-2">
        {journeys.map((journey) => (
          <li key={journey.id}>
            {journey.goalId ? (
              <button
                type="button"
                disabled={loadingId === journey.id}
                onClick={() => void handleJourney(journey)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-left transition hover:border-[var(--accent)] disabled:opacity-70"
              >
                <p className="text-sm font-medium text-[var(--text-primary)]">{journey.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{journey.description}</p>
              </button>
            ) : (
              <Link
                href={journey.href}
                className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 transition hover:border-[var(--accent)]"
              >
                <p className="text-sm font-medium text-[var(--text-primary)]">{journey.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{journey.description}</p>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
