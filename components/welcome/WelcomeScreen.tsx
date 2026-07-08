import Link from 'next/link';

import { OrbitMark } from '@/components/brand/OrbitMark';
import { OSA_VOICE } from '@/utils/first-experience/osa-voice';

export function WelcomeScreen() {
  return (
    <main className="first-experience-ambient flex min-h-full flex-1 flex-col items-center px-6 py-20 sm:py-28">
      <div className="wow-fade-in mx-auto w-full max-w-[680px] space-y-12 text-left">
        <header className="space-y-6">
          <div className="osa-presence-row flex items-start gap-4">
            <OrbitMark size="sm" breathe className="osa-presence-mark text-[var(--accent)]" />
            <p className="osa-presence-greeting pt-0.5 text-[15px] leading-relaxed text-[var(--text-secondary)]">
              {OSA_VOICE.welcome.presence}
            </p>
          </div>

          <h1 className="max-w-[16ch] text-[clamp(2.1rem,5vw,2.9rem)] font-normal leading-[1.08] tracking-[-0.03em] text-[var(--text-primary)]">
            {OSA_VOICE.welcome.title}
          </h1>

          <p className="max-w-[40ch] text-[clamp(1.02rem,2vw,1.125rem)] leading-[1.75] text-[var(--text-secondary)]">
            {OSA_VOICE.welcome.subtitle}
          </p>
        </header>

        <div className="space-y-4">
          <Link href="/login/intro" className="first-experience-primary inline-flex rounded-full px-8 py-3.5 text-[15px] font-medium text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2">
            {OSA_VOICE.welcome.cta}
          </Link>
          <p className="max-w-md text-[15px] leading-relaxed text-[var(--text-tertiary)]">
            {OSA_VOICE.welcome.note}
          </p>
        </div>
      </div>
    </main>
  );
}
