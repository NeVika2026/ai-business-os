'use client';

import { useEffect, useState } from 'react';

import { OsaEyes } from '@/components/home/OsaEyes';
import { HomeProcessSteps } from '@/components/home/HomeProcessSteps';
import { HOME_PROCESS_STEPS } from '@/utils/home/home-action';

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
    <div className="osa-fe-processing" role="status" aria-live="polite" aria-label="OSA готовит ответ">
      <div className="osa-fe-eyes-slot">
        <OsaEyes size="lg" active lookStraight skipIntro />
      </div>
      <p className="osa-fe-processing-label">Секунду…</p>
      <HomeProcessSteps visibleStepCount={visibleStepCount} />
    </div>
  );
}
