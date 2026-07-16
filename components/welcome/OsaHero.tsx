'use client';

import Image from 'next/image';
import type { RefObject } from 'react';

import { OsaEyes } from '@/components/home/OsaEyes';

export type OsaHeroGazeTarget = 'cursor' | 'input' | 'submit';

type OsaHeroProps = {
  gazeTarget?: OsaHeroGazeTarget;
  pupilDilate?: boolean;
  introReady?: boolean;
  inputFocused?: boolean;
  inputAnchorRef?: RefObject<HTMLElement | null>;
  submitAnchorRef?: RefObject<HTMLElement | null>;
};

export function OsaHero({
  gazeTarget = 'cursor',
  pupilDilate = false,
  introReady = true,
  inputFocused = false,
  inputAnchorRef,
  submitAnchorRef,
}: OsaHeroProps) {
  return (
    <div className="osa-login-hero" aria-hidden="true">
      <div className="osa-login-hero-glow" />
      <div className="osa-login-hero-image-wrap">
        <Image
          src="/osa/osa-hero.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 120vw, 72vw"
          className="osa-login-hero-image"
        />
      </div>

      <div className="osa-login-hero-eye-stage">
        <div className="osa-login-hero-eye-dim" aria-hidden="true">
          <span className="osa-login-hero-eye-dim-spot osa-login-hero-eye-dim-spot--left" />
          <span className="osa-login-hero-eye-dim-spot osa-login-hero-eye-dim-spot--right" />
        </div>

        <div className="osa-login-hero-eye-patches" aria-hidden="true">
          <span className="osa-login-hero-eye-patch osa-login-hero-eye-patch--left" />
          <span className="osa-login-hero-eye-patch osa-login-hero-eye-patch--right" />
        </div>

        <div className={`osa-login-hero-eyes ${introReady ? 'osa-login-hero-eyes--ready' : ''}`}>
          <OsaEyes
            size="overlay"
            active={introReady}
            skipIntro
            renderMode="overlay"
            gazeTarget={gazeTarget}
            inputFocused={inputFocused}
            inputAnchorRef={inputAnchorRef}
            submitAnchorRef={submitAnchorRef}
            pupilDilate={pupilDilate}
          />
        </div>
      </div>
    </div>
  );
}
