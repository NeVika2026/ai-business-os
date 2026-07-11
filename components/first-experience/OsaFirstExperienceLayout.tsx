'use client';

import { OsaHomeArtComposition } from '@/components/home/OsaHomeArtComposition';

type OsaFirstExperienceLayoutProps = {
  children: React.ReactNode;
  artActive?: boolean;
  artThinking?: boolean;
  /** Full-viewport hero — no side art column (login welcome). */
  hero?: boolean;
  className?: string;
};

export function OsaFirstExperienceLayout({
  children,
  artActive = false,
  artThinking = false,
  hero = false,
  className = '',
}: OsaFirstExperienceLayoutProps) {
  return (
    <div
      className={`osa-fe-canvas flex min-h-full flex-1 flex-col ${artActive ? 'osa-fe-canvas--active' : ''} ${hero ? 'osa-fe-canvas--hero' : ''} ${className}`.trim()}
    >
      <div className="osa-fe-depth" aria-hidden="true" />
      <div className="osa-fe-glow" aria-hidden="true" />
      <div className="osa-fe-blob osa-fe-blob--blue" aria-hidden="true" />
      <div className="osa-fe-blob osa-fe-blob--purple" aria-hidden="true" />

      {hero ? (
        <div className="osa-fe-stage osa-fe-stage--hero relative z-[1] flex-1">{children}</div>
      ) : (
        <div className="osa-fe-stage relative z-[1] mx-auto w-full max-w-[1240px] flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="osa-fe-grid">
            <div className="osa-fe-main">{children}</div>
            <div className="osa-fe-side">
              <OsaHomeArtComposition active={artActive} thinking={artThinking} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
