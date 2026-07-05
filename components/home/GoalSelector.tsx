'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { startGoalHandoff } from '@/app/(dashboard)/home/actions';
import { OsaErrorState } from '@/components/osa/OsaErrorState';
import { HOME_GOALS, isHomeGoalId } from '@/utils/home/home-mappers';
import type { HomeGoalId } from '@/utils/home/home-types';

export function GoalSelector() {
  const router = useRouter();
  const [selectedGoalId, setSelectedGoalId] = useState<HomeGoalId | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSelect(goalId: HomeGoalId) {
    setSelectedGoalId(goalId);
    setIsPreparing(true);
    setErrorMessage(null);

    const result = await startGoalHandoff(goalId);

    if (result.status === 'ok') {
      router.push(result.url);
      return;
    }

    setErrorMessage(result.message);
    setIsPreparing(false);
  }

  const selectedGoal = selectedGoalId
    ? HOME_GOALS.find((goal) => goal.id === selectedGoalId)
    : null;

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
        What would you like to achieve today?
      </h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Choose an outcome — we&apos;ll confirm what you need before we start.
      </p>

      {isPreparing && selectedGoal ? (
        <div
          role="status"
          className="mt-5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--text-primary)]"
        >
          Getting ready for <strong>{selectedGoal.label}</strong>...
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4">
          <OsaErrorState message={errorMessage} />
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {HOME_GOALS.map((goal) => {
          const isSelected = selectedGoalId === goal.id;

          return (
            <button
              key={goal.id}
              type="button"
              disabled={isPreparing}
              onClick={() => {
                if (isHomeGoalId(goal.id)) {
                  void handleSelect(goal.id);
                }
              }}
              className={`rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-wait disabled:opacity-70 ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-0)] hover:border-[var(--accent)]'
              }`}
            >
              <span aria-hidden="true" className="text-xl">
                {goal.icon}
              </span>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{goal.label}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{goal.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
