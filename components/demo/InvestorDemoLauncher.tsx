'use client';

import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore, useTransition } from 'react';

import { startInvestorDemo } from '@/app/(dashboard)/demo/actions';
import {
  isDemoModeEnabled,
  startDemoSession,
} from '@/utils/demo/osa-demo-mode';
import { totalInvestorDemoDurationMs } from '@/utils/demo/demo-orchestrator';

function subscribeToClientMount() {
  return () => {};
}

export function InvestorDemoLauncher() {
  const router = useRouter();
  const mounted = useSyncExternalStore(subscribeToClientMount, () => true, () => false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!mounted || !isDemoModeEnabled()) {
    return null;
  }

  const handleStart = () => {
    setError(null);

    startTransition(async () => {
      const result = await startInvestorDemo();

      if (result.status === 'failed') {
        setError(result.message);
        return;
      }

      startDemoSession(result.projectId);
      router.push(`/workspace/${result.projectId}?demo=1`);
    });
  };

  return (
    <section className="rounded-[24px] border border-[var(--border-subtle)]/80 bg-white px-6 py-6 sm:px-8 sm:py-7">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        Investor Demo
      </p>
      <h2 className="mt-3 text-[clamp(1.35rem,2vw,1.75rem)] font-medium leading-[1.25] tracking-[-0.02em] text-[var(--text-primary)]">
        Пройти OSA за ~{Math.round(totalInvestorDemoDurationMs() / 1000)} секунд
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
        First Contact, Morning Briefing, Executive Workspace, AI Orchestra, Executive Memory и
        Project Replay — на одном демонстрационном проекте.
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={handleStart}
        className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-6 py-3 text-[14px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'OSA готовит demo…' : 'Запустить Investor Demo'}
      </button>
      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
    </section>
  );
}
