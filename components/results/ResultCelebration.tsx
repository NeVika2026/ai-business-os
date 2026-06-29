import type { ResultCelebrationData } from '@/utils/home/wow-engine';

type ResultCelebrationProps = {
  celebration: ResultCelebrationData;
};

export function ResultCelebration({ celebration }: ResultCelebrationProps) {
  if (!celebration.show) {
    return null;
  }

  return (
    <section
      aria-live="polite"
      className="wow-fade-in rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4"
    >
      <p className="text-lg font-semibold text-[var(--text-primary)]">{celebration.headline}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{celebration.message}</p>
    </section>
  );
}
