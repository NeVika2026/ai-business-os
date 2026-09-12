'use client';

import { useMemo, useRef, useState } from 'react';

import {
  appendSpeechTranscript,
  canUseSpeechRecognition,
} from '@/utils/platform/voice-input';

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    0?: { transcript?: string };
    isFinal?: boolean;
  }>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type VoiceWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type VoiceInputButtonProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function VoiceInputButton({ value, onChange, disabled = false }: VoiceInputButtonProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);

  const supported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return canUseSpeechRecognition(window as VoiceWindow);
  }, []);

  const stop = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  };

  const start = () => {
    if (!supported || disabled || listening) return;

    const voiceWindow = window as VoiceWindow;
    const Recognition = voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = 0; index < event.results.length; index += 1) {
        const chunk = event.results[index]?.[0]?.transcript ?? '';
        transcript += ` ${chunk}`;
      }
      onChange(appendSpeechTranscript(value, transcript));
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  return (
    <button
      type="button"
      disabled={disabled || !supported}
      onClick={listening ? stop : start}
      aria-label={
        supported
          ? listening
            ? 'Остановить голосовой ввод'
            : 'Продиктовать задачу'
          : 'Голосовой ввод не поддерживается в этом браузере'
      }
      title={supported ? 'Голосовой ввод' : 'В этом браузере голосовой ввод недоступен'}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
        listening
          ? 'border-rose-400/60 bg-rose-500/15 text-rose-200'
          : 'border-white/10 bg-white/[0.05] text-white/55 hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30'
      }`}
    >
      <span aria-hidden="true">{listening ? '■' : '●'}</span>
    </button>
  );
}
