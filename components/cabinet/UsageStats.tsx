import { CABINET_LAYOUT } from '@/utils/cabinet/cabinet-config';
import type { UsageStatsData } from '@/utils/cabinet/dashboard-mappers';
import { formatAverageRuntime, formatSuccessRate } from '@/utils/cabinet/dashboard-mappers';

type UsageStatsProps = {
  usage: UsageStatsData;
};

export function UsageStats({ usage }: UsageStatsProps) {
  const items = [
    { id: 'today', label: "Today's runs", value: String(usage.todayRuns) },
    { id: 'week', label: 'This week', value: String(usage.weekRuns) },
    { id: 'month', label: 'This month', value: String(usage.monthRuns) },
    { id: 'avg', label: 'Average runtime', value: formatAverageRuntime(usage.averageRuntimeMs) },
    { id: 'success', label: 'Success rate', value: formatSuccessRate(usage.successRate) },
    {
      id: 'credits',
      label: 'AI credits',
      value: usage.totalCredits === null ? '—' : String(usage.totalCredits),
    },
  ];

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Usage</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Live execution usage from agent runs
        </p>
      </header>

      <div className={CABINET_LAYOUT.statsGrid}>
        {items.map((item) => (
          <div key={item.id} className="rounded-xl bg-[var(--surface-0)] px-3 py-4 sm:px-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
