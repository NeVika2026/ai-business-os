'use client';

import { useEffect, useRef, useState } from 'react';

import { OrbitMark } from '@/components/brand/OrbitMark';
import {
  THINKING_FIRST_MESSAGE_DELAY_MS,
  THINKING_MESSAGE_INTERVAL_MS,
  THINKING_MESSAGES,
} from '@/utils/runtime/thinking-messages';
import { playThinkingSceneSound } from '@/utils/runtime/thinking-sound';

function ThinkingMessages() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= THINKING_MESSAGES.length) {
      return;
    }

    const delay =
      visibleCount === 0 ? THINKING_FIRST_MESSAGE_DELAY_MS : THINKING_MESSAGE_INTERVAL_MS;

    const timer = window.setTimeout(() => {
      setVisibleCount((current) => current + 1);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [visibleCount]);

  return (
    <div className="mt-14 space-y-3 text-center">
      {THINKING_MESSAGES.slice(0, visibleCount).map((message) => (
        <p
          key={message}
          className="wow-fade-in text-sm leading-relaxed text-[var(--text-secondary)]"
        >
          {message}
        </p>
      ))}
    </div>
  );
}

export function ThinkingScene() {
  const soundPlayed = useRef(false);

  useEffect(() => {
    if (soundPlayed.current) {
      return;
    }

    soundPlayed.current = true;
    playThinkingSceneSound();
  }, []);

  return (
    <div
      className="flex min-h-[70vh] w-full flex-col items-center justify-center px-6 py-24"
      role="status"
      aria-live="polite"
      aria-label="Готовим первый результат"
    >
      <div className="wow-fade-in">
        <OrbitMark size="lg" />
      </div>
      <ThinkingMessages />
    </div>
  );
}
