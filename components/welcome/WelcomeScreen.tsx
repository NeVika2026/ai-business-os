'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { generateFirstPlan } from '@/app/login/actions';
import { IntroProcessingView } from '@/components/first-experience/IntroProcessingView';
import { OsaFirstExperienceLayout } from '@/components/first-experience/OsaFirstExperienceLayout';
import { HeroPromptBox } from '@/components/welcome/HeroPromptBox';
import { LoginWelcomeTopNav } from '@/components/welcome/LoginWelcomeTopNav';
import { OsaHero, type OsaHeroGazeTarget } from '@/components/welcome/OsaHero';
import { QuickActions } from '@/components/welcome/QuickActions';

function WelcomeFormContent() {
  const { pending } = useFormStatus();
  const [request, setRequest] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [inputHovered, setInputHovered] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);
  const [pupilDilate, setPupilDilate] = useState(false);
  const [eyesReady, setEyesReady] = useState(false);
  const inputAnchorRef = useRef<HTMLTextAreaElement>(null);
  const submitAnchorRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setEyesReady(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmitPulse = useCallback(() => {
    setPupilDilate(true);
    window.setTimeout(() => setPupilDilate(false), 260);
  }, []);

  const gazeTarget: OsaHeroGazeTarget = submitHovered
    ? 'submit'
    : inputFocused || inputHovered
      ? 'input'
      : 'cursor';

  if (pending) {
    return (
      <div className="osa-login-processing" role="status" aria-live="polite">
        <IntroProcessingView />
      </div>
    );
  }

  return (
    <>
      <OsaHero
        gazeTarget={gazeTarget}
        pupilDilate={pupilDilate}
        introReady={eyesReady}
        inputFocused={inputFocused}
        inputAnchorRef={inputAnchorRef}
        submitAnchorRef={submitAnchorRef}
      />

      <div className="osa-login-copy">
        <p className="osa-login-copy-kicker">Привет! Я OSA</p>
        <h1 className="osa-login-copy-title">
          Чем сегодня
          <br />
          помочь?
        </h1>
        <p className="osa-login-copy-subtitle">
          Я здесь, чтобы думать, создавать
          <br />
          и помогать тебе достигать большего.
        </p>
      </div>

      <div
        className="osa-login-prompt-stack"
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
          onSubmit={handleSubmitPulse}
        />
        <QuickActions
          onSelect={(text) => {
            setRequest(text);
            inputAnchorRef.current?.focus();
          }}
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
          <div className="osa-login-orb osa-login-orb--violet" />
          <div className="osa-login-orb osa-login-orb--coral" />
          <div className="osa-login-vignette" />
          <div className="osa-login-grain" />
        </div>

        <form action={generateFirstPlan} className="osa-login-scene-content">
          <WelcomeFormContent />
        </form>
      </section>
    </OsaFirstExperienceLayout>
  );
}
