'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { startGoalHandoff } from '@/app/(dashboard)/home/actions';
import type { ConversationChip } from '@/utils/home/concierge-mappers';
import { isHomeGoalId } from '@/utils/home/home-mappers';
import type { HomeGoalId } from '@/utils/home/home-types';

type ConversationStarterProps = {
  chips: ConversationChip[];
};

export function ConversationStarter({ chips }: ConversationStarterProps) {
  const router = useRouter();
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSelect(goalId: HomeGoalId, chipId: string) {
    setSelectedChipId(chipId);
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

  const selectedChip = chips.find((chip) => chip.id === selectedChipId);

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
        What would you like to improve today?
      </h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        OSA starts the conversation — pick a direction and your workspace will be prepared.
      </p>

      {isPreparing && selectedChip ? (
        <div
          role="status"
          className="mt-5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--text-primary)]"
        >
          OSA is preparing your workspace for <strong>{selectedChip.label}</strong>...
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 text-sm text-red-500" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            disabled={isPreparing}
            onClick={() => {
              if (isHomeGoalId(chip.goalId)) {
                void handleSelect(chip.goalId, chip.id);
              }
            }}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-wait disabled:opacity-70 ${
              selectedChipId === chip.id
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]'
                : 'border-[var(--border-subtle)] bg-[var(--surface-0)] text-[var(--text-primary)] hover:border-[var(--accent)]'
            }`}
          >
            <span aria-hidden="true">{chip.icon}</span>
            {chip.label}
          </button>
        ))}
      </div>
    </section>
  );
}
