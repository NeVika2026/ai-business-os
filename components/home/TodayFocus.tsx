import type { DailySummaryData } from '@/utils/home/home-types';

type TodayFocusProps = {
  summary: DailySummaryData;
};

export function TodayFocus({ summary }: TodayFocusProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Today&apos;s focus</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {summary.todayExecutions} executions today
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Completed" value={String(summary.completed)} />
        <Metric label="Failed" value={String(summary.failed)} />
        <Metric label="Runtime today" value={summary.runtimeLabel} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
