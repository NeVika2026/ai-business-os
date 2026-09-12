'use client';

import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

import { OsaEyes, type OsaPresenceState } from '@/components/home/OsaEyes';

export type OsaHeroGazeTarget = 'cursor' | 'input' | 'submit' | 'element';

type OsaHeroProps = {
  gazeTarget?: OsaHeroGazeTarget;
  pupilDilate?: boolean;
  eyeGlow?: boolean;
  squint?: boolean;
  introReady?: boolean;
  lookStraight?: boolean;
  inputFocused?: boolean;
  presence?: OsaPresenceState;
  thinking?: boolean;
  inputAnchorRef?: RefObject<HTMLElement | null>;
  submitAnchorRef?: RefObject<HTMLElement | null>;
  lookAtElementRef?: RefObject<HTMLElement | null>;
  onIntroComplete?: () => void;
  /** Dev-only eye calibration overlay (`/login?debugEyes=1`). */
  debugEyes?: boolean;
};

type CalibrationLabels = {
  top: string;
  left: string;
  width: string;
  gap: string;
  scaleX: string;
  scaleY: string;
  rotation: string;
};

function OsaEyesDebugOverlay({ labels }: { labels: CalibrationLabels }) {
  return (
    <div className="osa-login-hero-eyes-debug" aria-hidden="true">
      <div className="osa-login-hero-eyes-debug-frame osa-login-hero-eyes-debug-frame--wrap" />
      <div className="osa-login-hero-eyes-debug-crosshair osa-login-hero-eyes-debug-crosshair--wrap" />
      <div className="osa-login-hero-eyes-debug-frame osa-login-hero-eyes-debug-frame--stage" />
      <div className="osa-login-hero-eyes-debug-crosshair osa-login-hero-eyes-debug-crosshair--stage" />
      <div className="osa-login-hero-eyes-debug-label">
        <span>top: {labels.top}</span>
        <span>left: {labels.left}</span>
        <span>width: {labels.width}</span>
        <span>gap: {labels.gap}</span>
        <span>
          scale: {labels.scaleX} / {labels.scaleY}
        </span>
        <span>rot: {labels.rotation}</span>
      </div>
    </div>
  );
}

export function OsaHero({
  gazeTarget = 'cursor',
  pupilDilate = false,
  eyeGlow = false,
  squint = false,
  introReady = true,
  lookStraight = false,
  inputFocused = false,
  presence = 'idle',
  thinking = false,
  inputAnchorRef,
  submitAnchorRef,
  lookAtElementRef,
  onIntroComplete,
  debugEyes = false,
}: OsaHeroProps) {
  const [labels, setLabels] = useState<CalibrationLabels>({
    top: '—',
    left: '—',
    width: '—',
    gap: '—',
    scaleX: '—',
    scaleY: '—',
    rotation: '—',
  });

  useEffect(() => {
    if (!debugEyes) {
      return;
    }

    const wrap = document.querySelector('.osa-login-hero-image-wrap');
    if (!(wrap instanceof HTMLElement)) {
      return;
    }

    const read = () => {
      const styles = getComputedStyle(wrap);
      setLabels({
        top: styles.getPropertyValue('--osa-eyes-top').trim() || '—',
        left: styles.getPropertyValue('--osa-eyes-left').trim() || '—',
        width: styles.getPropertyValue('--osa-eyes-width').trim() || '—',
        gap: styles.getPropertyValue('--osa-eyes-gap').trim() || '—',
        scaleX: `${styles.getPropertyValue('--osa-eye-size').trim() || '—'} × ${styles.getPropertyValue('--osa-eye-scale-x').trim() || '—'}`,
        scaleY: styles.getPropertyValue('--osa-eye-scale-y').trim() || '—',
        rotation: styles.getPropertyValue('--osa-eyes-rotation').trim() || '—',
      });
    };

    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [debugEyes]);

  return (
    <div
      className={`osa-login-hero${debugEyes ? ' osa-login-hero--debug-eyes' : ''}${thinking ? ' osa-login-hero--thinking' : ''}`}
      aria-hidden="true"
      data-presence={thinking ? 'submit' : presence}
    >
      <div className="osa-login-hero-glow" />
      <div className="osa-login-hero-image-wrap">
        <div className="osa-login-hero-media">
          <div className="osa-login-hero-breathe">
            <div className="osa-login-hero-face" aria-hidden="true">
              <div className="osa-login-hero-face-aura" />
              <div className="osa-login-hero-face-body">
                <div className="osa-login-hero-face-fur-base" />
                <div className="osa-login-hero-face-fur-depth" />
                <div className="osa-login-hero-face-fur-strands" />
                <div className="osa-login-hero-face-cheek osa-login-hero-face-cheek--left" />
                <div className="osa-login-hero-face-cheek osa-login-hero-face-cheek--right" />
                <div className="osa-login-hero-face-highlight" />
              </div>
            </div>
            <div className="osa-login-hero-fur" />
            <div className="osa-login-hero-shimmer" />

            <div className="osa-login-hero-eye-stage">
              <div className="osa-login-hero-eye-dim" aria-hidden="true">
                <span className="osa-login-hero-eye-dim-spot osa-login-hero-eye-dim-spot--left" />
                <span className="osa-login-hero-eye-dim-spot osa-login-hero-eye-dim-spot--right" />
              </div>

              <div className={`osa-login-hero-eyes ${introReady ? 'osa-login-hero-eyes--ready' : ''}`}>
                <OsaEyes
                  size="overlay"
                  active={introReady}
                  introVariant="hero"
                  renderMode="overlay"
                  lookStraight={lookStraight || thinking}
                  gazeTarget={thinking ? 'input' : gazeTarget}
                  inputFocused={inputFocused || thinking}
                  inputAnchorRef={inputAnchorRef}
                  submitAnchorRef={submitAnchorRef}
                  lookAtElementRef={lookAtElementRef}
                  pupilDilate={pupilDilate || thinking}
                  eyeGlow={eyeGlow || thinking}
                  squint={squint}
                  presence={thinking ? 'submit' : presence}
                  onPresenceReady={onIntroComplete}
                />
              </div>
            </div>
          </div>

          {debugEyes ? <OsaEyesDebugOverlay labels={labels} /> : null}
        </div>
      </div>

      {thinking ? (
        <p className="osa-login-hero-thinking-label" role="status" aria-live="polite">
          Думаю…
        </p>
      ) : null}
    </div>
  );
}
