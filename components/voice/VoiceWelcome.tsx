'use client';

import { useEffect, useRef, useState } from 'react';

import {
  isSpeechSynthesisSupported,
  speakWelcomeText,
  stopWelcomeSpeech,
  VOICE_WELCOME_BUTTON_LABEL,
  VOICE_WELCOME_STOP_LABEL,
} from '@/utils/voice/voice-welcome';

type VoiceWelcomeProps = {
  welcomeText: string;
  buttonLabel?: string;
  stopLabel?: string;
  className?: string;
};

function SpeakerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 text-[var(--accent)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" strokeLinecap="round" />
    </svg>
  );
}

function StopIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[var(--accent)]"
    />
  );
}

export function VoiceWelcome({
  welcomeText,
  buttonLabel = VOICE_WELCOME_BUTTON_LABEL,
  stopLabel = VOICE_WELCOME_STOP_LABEL,
  className,
}: VoiceWelcomeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      stopWelcomeSpeech();
    };
  }, []);

  function handleEnable() {
    if (!isSpeechSynthesisSupported()) {
      setShowTextFallback(true);
      return;
    }

    setShowTextFallback(false);
    setIsPlaying(true);

    utteranceRef.current = speakWelcomeText(welcomeText, {
      onEnd: () => setIsPlaying(false),
      onError: () => {
        setIsPlaying(false);
        setShowTextFallback(true);
      },
    });

    if (!utteranceRef.current) {
      setIsPlaying(false);
      setShowTextFallback(true);
    }
  }

  function handleStop() {
    stopWelcomeSpeech();
    utteranceRef.current = null;
    setIsPlaying(false);
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {isPlaying ? (
          <button
            type="button"
            onClick={handleStop}
            aria-label={stopLabel}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3.5 py-1.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <StopIcon />
            {stopLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEnable}
            aria-label={buttonLabel}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3.5 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <SpeakerIcon />
            {buttonLabel}
          </button>
        )}
      </div>

      {showTextFallback ? (
        <p
          aria-live="polite"
          className="mt-3 max-w-2xl border-l border-[var(--accent)]/30 pl-4 text-left text-sm leading-relaxed text-[var(--text-secondary)]"
        >
          {welcomeText}
        </p>
      ) : null}
    </div>
  );
}
