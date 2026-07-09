'use client';

import { useEffect, useRef, useState } from 'react';

import {
  LIVE_THINKING_ALMOST,
  LIVE_THINKING_HEADLINE,
  LIVE_THINKING_START_MS,
  LIVE_THINKING_STEP_MS,
  LIVE_THINKING_STEPS,
  buildLiveThinkingStatuses,
  canRevealDiscovery,
} from '@/utils/home/live-thinking';

type OsaLiveThinkingProps = {
  gatewayDone: boolean;
  onComplete: () => void;
};

export function OsaLiveThinking({ gatewayDone, onComplete }: OsaLiveThinkingProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (visibleCount >= LIVE_THINKING_STEPS.length) {
      return;
    }

    const delay = visibleCount === 0 ? LIVE_THINKING_START_MS : LIVE_THINKING_STEP_MS;
    const timer = window.setTimeout(() => {
      setVisibleCount((current) => Math.min(current + 1, LIVE_THINKING_STEPS.length));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [visibleCount]);

  useEffect(() => {
    if (completedRef.current || !canRevealDiscovery(visibleCount, gatewayDone)) {
      return;
    }

    const timer = window.setTimeout(() => {
      completedRef.current = true;
      onComplete();
    }, 280);

    return () => window.clearTimeout(timer);
  }, [gatewayDone, onComplete, visibleCount]);

  const statuses = buildLiveThinkingStatuses(visibleCount, gatewayDone);

  return (
    <section className="osa-live-thinking" aria-live="polite" aria-label="OSA думает">
      <p className="osa-live-thinking-headline">{LIVE_THINKING_HEADLINE}</p>

      <ol className="osa-live-thinking-steps">
        {statuses.map((status, index) => {
          if (status.kind === 'almost') {
            return (
              <li key="almost" className="osa-live-thinking-item osa-live-thinking-item--almost">
                <span className="osa-live-thinking-mark osa-live-thinking-mark--soft" aria-hidden="true">
                  …
                </span>
                <span>{LIVE_THINKING_ALMOST}</span>
              </li>
            );
          }

          const isDone = status.done;
          const isActive = !isDone && index === statuses.length - 1;

          return (
            <li
              key={status.label}
              className={`osa-live-thinking-item ${
                isDone ? 'osa-live-thinking-item--done' : ''
              } ${isActive ? 'osa-live-thinking-item--active' : ''}`}
            >
              <span
                className={`osa-live-thinking-mark ${
                  isDone ? 'osa-live-thinking-mark--done' : 'osa-live-thinking-mark--soft'
                }`}
                aria-hidden="true"
              >
                {isDone ? '✓' : '…'}
              </span>
              <span>{status.label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
