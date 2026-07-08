'use client';

import { useEffect, useState } from 'react';

import { OrbitMark } from '@/components/brand/OrbitMark';
import { HomeProcessSteps } from '@/components/home/HomeProcessSteps';
import { HOME_PROCESS_STEPS } from '@/utils/home/home-action';
import { OSA_VOICE } from '@/utils/first-experience/osa-voice';

const STEP_INTERVAL_MS = 700;

export function IntroProcessingView() {
  const [visibleStepCount, setVisibleStepCount] = useState(1);

  useEffect(() => {
    const timers = HOME_PROCESS_STEPS.map((_, index) =>
      window.setTimeout(() => setVisibleStepCount(index + 1), STEP_INTERVAL_MS * (index + 1)),
    );

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  return (
    <div className="space-y-10 py-4" role="status" aria-live="polite" aria-label="OSA готовит ответ">
      <div className="osa-orbit-presence flex justify-start">
        <OrbitMark size="md" breathe className="text-[var(--accent)]" />
      </div>

      <div className="space-y-5">
        <p className="osa-presence-greeting text-[15px] text-[var(--text-secondary)]">
          {OSA_VOICE.intro.processing}
        </p>
        <HomeProcessSteps visibleStepCount={visibleStepCount} />
      </div>
    </div>
  );
}
