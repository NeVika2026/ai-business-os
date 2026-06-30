import Link from 'next/link';

import type { DailyMission, PersonalInsight } from '@/utils/home/concierge-mappers';

type OsaAssistantPanelProps = {
  insights: PersonalInsight[];
  dailyMission: DailyMission;
};

export function OsaAssistantPanel({ insights, dailyMission }: OsaAssistantPanelProps) {
  return (
    <aside
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6"
      aria-labelledby="osa-assistant-heading"
    >
      <header className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          Navigator
        </p>
        <h2
          id="osa-assistant-heading"
          className="text-lg font-semibold tracking-tight text-[var(--text-primary)]"
        >
          OSA заметила
        </h2>
      </header>

      <ul className="mt-5 space-y-2.5">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className="flex gap-2.5 text-sm leading-relaxed text-[var(--text-secondary)]"
          >
            <span aria-hidden="true" className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
            <span>{insight.message}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-4 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
          Следующий шаг
        </p>
        <p className="mt-2 text-sm font-medium leading-snug text-[var(--text-primary)]">
          {dailyMission.title}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
          {dailyMission.description}
        </p>
        <Link
          href={dailyMission.href}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Предлагаю продолжить
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </aside>
  );
}
