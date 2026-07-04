'use client';

import { OrbitMark } from '@/components/brand/OrbitMark';
import type { MorningBriefing } from '@/utils/workspace/morning-briefing';

type MorningBriefingProps = {
  briefing: MorningBriefing;
  isPending?: boolean;
  onStart: () => void;
};

export function MorningBriefingPanel({ briefing, isPending = false, onStart }: MorningBriefingProps) {
  return (
    <article className="osa-morning-briefing osa-exec-fade mx-auto w-full max-w-[680px] px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <div className="flex justify-center">
        <OrbitMark size="md" breathe className="text-[var(--accent)] opacity-80" />
      </div>

      <header className="mt-12">
        <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.12] tracking-[-0.03em] text-[var(--text-primary)]">
          {briefing.greeting}
        </h1>
        <p className="mt-8 text-[17px] leading-[1.7] text-[var(--text-secondary)]">{briefing.intro}</p>
      </header>

      <div className="mt-14 space-y-0">
        {briefing.actions.map((action, index) => (
          <section key={`${action.title}-${index}`} className="border-t border-[var(--border-subtle)]/80 py-10 first:border-t-0 first:pt-0">
            <p className="text-[13px] tabular-nums tracking-[0.08em] text-[var(--text-tertiary)]">{index + 1}.</p>
            <h2 className="mt-4 text-[clamp(1.35rem,2.2vw,1.75rem)] font-medium leading-[1.3] tracking-[-0.02em] text-[var(--text-primary)]">
              {action.title}
            </h2>
            <div className="mt-5 space-y-1 text-[15px] leading-relaxed text-[var(--text-secondary)]">
              <p>{action.estimate}</p>
              <p>{action.priorityLabel}</p>
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-14 border-t border-[var(--border-subtle)]/80 pt-10">
        <p className="text-[17px] leading-[1.65] text-[var(--text-primary)]">{briefing.progressLine}</p>
        <button
          type="button"
          disabled={isPending}
          onClick={onStart}
          className="mt-10 inline-flex rounded-full bg-[var(--accent)] px-8 py-3.5 text-[15px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'OSA готовит…' : briefing.ctaLabel}
        </button>
      </footer>
    </article>
  );
}
