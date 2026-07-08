'use client';

import { HOME_PROCESS_STEPS } from '@/utils/home/home-action';

type HomeProcessStepsProps = {
  visibleStepCount: number;
  allComplete?: boolean;
  preview?: boolean;
};

export function HomeProcessSteps({
  visibleStepCount,
  allComplete = false,
  preview = false,
}: HomeProcessStepsProps) {
  return (
    <ol className="space-y-3" aria-label="OSA думает над ответом">
      {HOME_PROCESS_STEPS.map((step, index) => {
        const isVisible = preview || allComplete || index < visibleStepCount;
        const isActive = !preview && !allComplete && index === visibleStepCount - 1;

        return (
          <li
            key={step}
            className={`flex items-center gap-3 text-[15px] transition-all duration-700 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            } ${preview ? 'opacity-60' : ''}`}
          >
            <span
              aria-hidden="true"
              className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-500 ${
                isActive
                  ? 'scale-125 bg-[var(--accent)]'
                  : isVisible
                    ? 'bg-[var(--text-tertiary)]'
                    : 'bg-transparent'
              }`}
            />
            <span className={isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
