import type { DailySummaryData } from '@/utils/home/home-types';

type DailySummaryProps = {
  summary: DailySummaryData;
};

export function DailySummary({ summary }: DailySummaryProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Daily summary</h2>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Today's executions" value={String(summary.todayExecutions)} />
        <Stat label="Completed" value={String(summary.completed)} />
        <Stat label="Failed" value={String(summary.failed)} />
        <Stat label="Runtime" value={summary.runtimeLabel} />
        <Stat label="AI usage" value={summary.aiUsageLabel} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
