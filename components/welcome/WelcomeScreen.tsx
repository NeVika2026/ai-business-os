'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';

import { generateFirstPlan } from '@/app/login/actions';
import { OsaFirstExperienceLayout } from '@/components/first-experience/OsaFirstExperienceLayout';
import type { OsaPresenceState } from '@/components/home/OsaEyes';
import { HeroPromptBox } from '@/components/welcome/HeroPromptBox';
import { LoginWelcomeTopNav } from '@/components/welcome/LoginWelcomeTopNav';
import { OsaHero, type OsaHeroGazeTarget } from '@/components/welcome/OsaHero';
import { QuickActions } from '@/components/welcome/QuickActions';

function resolvePresence(input: {
  pending: boolean;
  submitPulse: boolean;
  quickActionHovered: boolean;
  submitHovered: boolean;
  isTyping: boolean;
  inputFocused: boolean;
  inputHovered: boolean;
}): OsaPresenceState {
  if (input.pending || input.submitPulse || input.submitHovered) {
    return 'submit';
  }

  if (input.quickActionHovered) {
    return 'quick-action-hover';
  }

  if (input.isTyping) {
    return 'typing';
  }

  if (input.inputFocused) {
    return 'input-focus';
  }

  if (input.inputHovered) {
    return 'input-hover';
  }

  return 'idle';
}

function useDebugEyesEnabled(): boolean {
  const searchParams = useSearchParams();
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  return searchParams.get('debugEyes') === '1';
}

function useLoginParallax(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const scene = document.querySelector('.osa-login-scene');
    if (!(scene instanceof HTMLElement)) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      const nx = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
      const ny = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
      scene.style.setProperty('--osa-parallax-x', `${nx * 28}px`);
      scene.style.setProperty('--osa-parallax-y', `${ny * 18}px`);
      scene.style.setProperty('--osa-parallax-tilt-x', `${ny * -2.5}deg`);
      scene.style.setProperty('--osa-parallax-tilt-y', `${nx * 3.5}deg`);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [enabled]);
}

function WelcomeFormContent() {
  const { pending } = useFormStatus();
  const debugEyes = useDebugEyesEnabled();
  useLoginParallax(!pending);

  const [request, setRequest] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [inputHovered, setInputHovered] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [quickActionHovered, setQuickActionHovered] = useState(false);
  const [pupilDilate, setPupilDilate] = useState(false);
  const [submitPulse, setSubmitPulse] = useState(false);
  const [furReady, setFurReady] = useState(false);
  const [eyesReady, setEyesReady] = useState(false);
  const [lookStraight, setLookStraight] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const inputAnchorRef = useRef<HTMLTextAreaElement>(null);
  const submitAnchorRef = useRef<HTMLButtonElement>(null);
  const lookAtElementRef = useRef<HTMLElement | null>(null);
  const typingIdleTimerRef = useRef<number | null>(null);
  const submitPulseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const glowTimer = window.setTimeout(() => setFurReady(true), 180);
    const eyesTimer = window.setTimeout(() => setEyesReady(true), 680);
    const noticeTimer = window.setTimeout(() => setLookStraight(false), 1_050);
    const contentFallbackTimer = window.setTimeout(() => setContentVisible(true), 2_200);

    return () => {
      window.clearTimeout(glowTimer);
      window.clearTimeout(eyesTimer);
      window.clearTimeout(noticeTimer);
      window.clearTimeout(contentFallbackTimer);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typingIdleTimerRef.current !== null) {
        window.clearTimeout(typingIdleTimerRef.current);
      }

      if (submitPulseTimerRef.current !== null) {
        window.clearTimeout(submitPulseTimerRef.current);
      }
    };
  }, []);

  const handleIntroComplete = useCallback(() => {
    setContentVisible(true);
  }, []);

  const handleSubmitPulse = useCallback(() => {
    setSubmitPulse(true);
    setPupilDilate(true);

    if (submitPulseTimerRef.current !== null) {
      window.clearTimeout(submitPulseTimerRef.current);
    }

    submitPulseTimerRef.current = window.setTimeout(() => {
      setPupilDilate(false);
      setSubmitPulse(false);
    }, 280);
  }, []);

  const handleTypingChange = useCallback((typing: boolean) => {
    if (typingIdleTimerRef.current !== null) {
      window.clearTimeout(typingIdleTimerRef.current);
      typingIdleTimerRef.current = null;
    }

    if (typing) {
      setIsTyping(true);
      typingIdleTimerRef.current = window.setTimeout(() => setIsTyping(false), 900);
      return;
    }

    setIsTyping(false);
  }, []);

  const handleQuickActionHover = useCallback((element: HTMLElement | null) => {
    lookAtElementRef.current = element;
    setQuickActionHovered(Boolean(element));
  }, []);

  const presence = resolvePresence({
    pending,
    submitPulse,
    quickActionHovered,
    submitHovered,
    isTyping,
    inputFocused,
    inputHovered,
  });

  const gazeTarget: OsaHeroGazeTarget =
    presence === 'quick-action-hover'
      ? 'element'
      : presence === 'submit' || pending
        ? 'input'
        : presence === 'input-focus' || presence === 'input-hover' || presence === 'typing'
          ? 'input'
          : 'cursor';

  return (
    <>
      <OsaHero
        gazeTarget={gazeTarget}
        pupilDilate={pupilDilate || inputFocused || pending}
        eyeGlow={inputFocused || presence === 'submit' || pending}
        squint={quickActionHovered || submitHovered}
        introReady={eyesReady && furReady}
        lookStraight={lookStraight || pending}
        inputFocused={inputFocused || pending}
        presence={presence}
        thinking={pending}
        inputAnchorRef={inputAnchorRef}
        submitAnchorRef={submitAnchorRef}
        lookAtElementRef={lookAtElementRef}
        onIntroComplete={handleIntroComplete}
        debugEyes={debugEyes}
      />

      <div className={`osa-login-copy ${contentVisible ? 'osa-login-copy--visible' : ''}`}>
        <p className="osa-login-copy-kicker">Привет. Я OSA.</p>
        <h1 className="osa-login-copy-title">Чем сегодня помочь?</h1>
        <p className="osa-login-copy-subtitle">
          Опишите, что хотите создать, улучшить или решить.
        </p>
      </div>

      <div
        className={`osa-login-prompt-stack ${contentVisible ? 'osa-login-prompt-stack--visible' : ''}${pending ? ' osa-login-prompt-stack--thinking' : ''}`}
        onMouseEnter={() => setInputHovered(true)}
        onMouseLeave={() => setInputHovered(false)}
      >
        <HeroPromptBox
          value={request}
          onChange={setRequest}
          inputAnchorRef={inputAnchorRef}
          submitAnchorRef={submitAnchorRef}
          onFocusChange={setInputFocused}
          onSubmitHover={setSubmitHovered}
          onTypingChange={handleTypingChange}
          onSubmit={handleSubmitPulse}
        />
        <QuickActions
          onSelect={(text) => {
            setRequest(text);
            setIsTyping(true);
            inputAnchorRef.current?.focus();
          }}
          onHoverChange={handleQuickActionHover}
        />
      </div>
    </>
  );
}

export function WelcomeScreen() {
  return (
    <OsaFirstExperienceLayout hero className="osa-fe-canvas--login-hero">
      <section className="osa-login-scene" aria-label="OSA — стартовый экран">
        <LoginWelcomeTopNav />

        <div className="osa-login-scene-bg" aria-hidden="true">
          <div className="osa-login-orb osa-login-orb--blue" />
          <div className="osa-login-orb osa-login-orb--violet" />
          <div className="osa-login-orb osa-login-orb--coral" />
          <div className="osa-login-orb osa-login-orb--soft" />
          <div className="osa-login-vignette" />
          <div className="osa-login-grain" />
        </div>

        <form action={generateFirstPlan} className="osa-login-scene-content">
          <Suspense fallback={null}>
            <WelcomeFormContent />
          </Suspense>
        </form>
      </section>
    </OsaFirstExperienceLayout>
  );
}
