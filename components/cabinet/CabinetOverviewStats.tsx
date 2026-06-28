import type { DashboardOverviewMetrics } from '@/utils/cabinet/dashboard-mappers';
import { formatExecutionTimeMs } from '@/utils/cabinet/dashboard-mappers';

type CabinetOverviewStatsProps = {
  overview: DashboardOverviewMetrics;
};

const OVERVIEW_CARDS = [
  { key: 'activeExecutions' as const, label: 'Active executions' },
  { key: 'completedExecutions' as const, label: 'Completed' },
  { key: 'failedExecutions' as const, label: 'Failed' },
  { key: 'executionTimeTodayMs' as const, label: 'Execution time today' },
  { key: 'totalAiRuns' as const, label: 'Total AI runs' },
];

export function CabinetOverviewStats({ overview }: CabinetOverviewStatsProps) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {OVERVIEW_CARDS.map((card) => {
        const value =
          card.key === 'executionTimeTodayMs'
            ? formatExecutionTimeMs(overview.executionTimeTodayMs)
            : String(overview[card.key]);

        return (
          <article
            key={card.key}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
          </article>
        );
      })}
    </section>
  );
}
