'use client';

import { useState } from 'react';

import { getHomeGoalById, HOME_GOALS, isHomeGoalId } from '@/utils/home/home-mappers';
import { HOME_GOAL_STORAGE_KEY, type HomeGoalId } from '@/utils/home/home-types';

function readStoredGoal(): HomeGoalId | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(HOME_GOAL_STORAGE_KEY);

  if (stored && isHomeGoalId(stored)) {
    return stored;
  }

  return null;
}

export function GoalSelector() {
  const [selectedGoalId, setSelectedGoalId] = useState<HomeGoalId | null>(readStoredGoal);
  const [isPreparing, setIsPreparing] = useState(false);

  function handleSelect(goalId: HomeGoalId) {
    window.localStorage.setItem(HOME_GOAL_STORAGE_KEY, goalId);
    setSelectedGoalId(goalId);
    setIsPreparing(true);
  }

  const selectedGoal = selectedGoalId ? getHomeGoalById(selectedGoalId) : null;

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
        What would you like to achieve today?
      </h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Choose an outcome. OSA will prepare the right workspace — no modules to pick.
      </p>

      {isPreparing && selectedGoal ? (
        <div
          role="status"
          className="mt-5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--text-primary)]"
        >
          OSA is preparing your workspace for <strong>{selectedGoal.label}</strong>...
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {HOME_GOALS.map((goal) => {
          const isSelected = selectedGoalId === goal.id;

          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => handleSelect(goal.id)}
              className={`rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
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
