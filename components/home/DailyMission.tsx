'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { startGoalHandoff } from '@/app/(dashboard)/home/actions';
import type { DailyMission } from '@/utils/home/concierge-mappers';
import { isHomeGoalId } from '@/utils/home/home-mappers';

type DailyMissionProps = {
  mission: DailyMission;
};

export function DailyMission({ mission }: DailyMissionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (!mission.goalId || !isHomeGoalId(mission.goalId)) {
      router.push(mission.href);
      return;
    }

    setLoading(true);
    const result = await startGoalHandoff(mission.goalId);

    if (result.status === 'ok') {
      router.push(result.url);
      return;
    }

    setLoading(false);
    router.push(mission.href);
  }

  return (
    <section className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4 sm:p-5">
      <header className="mb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
          Daily mission
        </p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{mission.title}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{mission.description}</p>
      </header>

      {mission.goalId ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleStart()}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
        >
          {loading ? 'Preparing...' : 'Start with OSA'}
        </button>
      ) : (
        <Link
          href={mission.href}
          className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          Continue
        </Link>
      )}
    </section>
  );
}
