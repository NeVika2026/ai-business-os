'use client';

import { HOME_PROCESS_STEPS } from '@/utils/home/home-action';

type HomeProcessStepsProps = {
  visibleStepCount: number;
};

export function HomeProcessSteps({ visibleStepCount }: HomeProcessStepsProps) {
  return (
    <ol className="space-y-4" aria-label="OSA обрабатывает задачу">
      {HOME_PROCESS_STEPS.map((step, index) => {
        const isVisible = index < visibleStepCount;
        const isActive = index === visibleStepCount - 1;

        return (
          <li
            key={step}
            className={`flex items-center gap-3 text-[15px] transition-all duration-500 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] ${
                isVisible
                  ? isActive
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'bg-emerald-500/15 text-emerald-700'
                  : 'bg-[var(--surface-1)] text-[var(--text-tertiary)]'
              }`}
            >
              {isVisible && !isActive ? '✓' : index + 1}
            </span>
            <span className={isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
