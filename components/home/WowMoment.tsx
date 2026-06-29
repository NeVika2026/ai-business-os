'use client';

import { useEffect, useState } from 'react';

import type { MeaningfulLoadingData, WowMomentData } from '@/utils/home/wow-engine';

type WowMomentProps = {
  loading: MeaningfulLoadingData;
  moment: WowMomentData;
  onContinue: () => void;
  autoContinueMs?: number;
};

function MeaningfulLoadingPanel({
  loading,
  visibleStepCount,
}: {
  loading: MeaningfulLoadingData;
  visibleStepCount: number;
}) {
  return (
    <div className="space-y-3 text-left">
      {loading.steps.map((step, index) => {
        const isVisible = index < visibleStepCount;

        return (
          <p
            key={step.id}
            className={`flex items-center gap-2 text-sm transition-all duration-500 ${
              isVisible ? 'wow-fade-in translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                isVisible ? 'bg-emerald-500/15 text-emerald-300' : 'bg-[var(--surface-0)]'
              }`}
            >
              {isVisible ? '✓' : '·'}
            </span>
            <span className="text-[var(--text-primary)]">{step.label}</span>
          </p>
        );
      })}

      {visibleStepCount >= loading.steps.length ? (
        <p className="wow-fade-in pt-1 text-sm font-medium text-[var(--accent)]">{loading.finale}</p>
      ) : null}
    </div>
  );
}

export function WowMoment({
  loading,
  moment,
  onContinue,
  autoContinueMs = 2800,
}: WowMomentProps) {
  const [phase, setPhase] = useState<'loading' | 'moment'>('loading');
  const [visibleStepCount, setVisibleStepCount] = useState(0);

  useEffect(() => {
    if (phase !== 'loading') {
      return;
    }

    const timers: number[] = [];

    loading.steps.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleStepCount(index + 1);
        }, (index + 1) * 650),
      );
    });

    timers.push(
      window.setTimeout(() => {
        setPhase('moment');
      }, loading.steps.length * 650 + 500),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [loading.steps, phase]);

  useEffect(() => {
    if (phase !== 'moment') {
      return;
    }

    const timer = window.setTimeout(() => {
      onContinue();
    }, autoContinueMs);

    return () => window.clearTimeout(timer);
  }, [phase, autoContinueMs, onContinue]);

  if (phase === 'loading') {
    return (
      <section className="mx-auto w-full max-w-xl space-y-4">
        <MeaningfulLoadingPanel loading={loading} visibleStepCount={visibleStepCount} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-xl space-y-6 text-center">
      <div className="wow-rise-in space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
          {moment.goalTitle}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
          {moment.headline}
        </h1>
        <p className="text-base text-[var(--text-secondary)]">{moment.subline}</p>
        <p className="text-sm text-[var(--text-primary)]">{moment.highlight}</p>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="wow-fade-in inline-flex rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        Continue
      </button>
    </section>
  );
}
