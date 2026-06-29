import type { PersonalInsight } from '@/utils/home/concierge-mappers';

type PersonalInsightsProps = {
  insights: PersonalInsight[];
};

const TONE_STYLES: Record<PersonalInsight['tone'], string> = {
  positive: 'border-emerald-500/30 bg-emerald-500/10',
  neutral: 'border-[var(--border-subtle)] bg-[var(--surface-0)]',
  warning: 'border-amber-500/30 bg-amber-500/10',
};

export function PersonalInsights({ insights }: PersonalInsightsProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Personal insights</h2>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className={`rounded-xl border px-3 py-2 text-sm text-[var(--text-primary)] ${TONE_STYLES[insight.tone]}`}
          >
            {insight.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
