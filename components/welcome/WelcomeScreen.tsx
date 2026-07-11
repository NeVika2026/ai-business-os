'use client';

import Link from 'next/link';

import { OsaEyes } from '@/components/home/OsaEyes';
import { OsaFirstExperienceLayout } from '@/components/first-experience/OsaFirstExperienceLayout';

export function WelcomeScreen() {
  return (
    <OsaFirstExperienceLayout hero artActive className="osa-fe-canvas--login-welcome">
      <section className="osa-fe-premium-hero" aria-label="OSA">
        <div className="osa-fe-premium-aurora osa-fe-premium-aurora--blue" aria-hidden="true" />
        <div className="osa-fe-premium-aurora osa-fe-premium-aurora--violet" aria-hidden="true" />
        <div className="osa-fe-premium-aurora osa-fe-premium-aurora--coral" aria-hidden="true" />
        <div className="osa-fe-premium-vignette" aria-hidden="true" />

        <div className="osa-fe-premium-eyes-stage">
          <div className="osa-fe-premium-eyes-radiance" aria-hidden="true" />
          <div className="osa-fe-premium-eyes-ring" aria-hidden="true" />
          <div className="osa-fe-premium-eyes-core">
            <OsaEyes size="hero" active introVariant="default" />
          </div>
        </div>

        <div className="osa-fe-premium-foot">
          <p className="osa-fe-premium-mark">OSA</p>
          <p className="osa-fe-premium-line">Давайте разберёмся вместе.</p>
          <Link href="/login/intro" className="osa-fe-premium-enter">
            <span>Начать</span>
            <span className="osa-fe-premium-enter-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </section>
    </OsaFirstExperienceLayout>
  );
}
