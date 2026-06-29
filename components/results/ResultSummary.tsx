import type { ResultSummary as ResultSummaryData } from '@/utils/results/result-mappers';

type ResultSummaryProps = {
  summary: ResultSummaryData;
};

export function ResultSummary({ summary }: ResultSummaryProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Summary</h2>
        <p className="text-sm text-[var(--text-secondary)]">What you asked for and what you got</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">What was requested</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-primary)]">
            {summary.requested}
          </p>
        </article>

        <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">What was completed</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
            {summary.completed}
          </p>
        </article>

        <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">Key outcome</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-primary)]">
            {summary.keyOutcome}
          </p>
        </article>
      </div>
    </section>
  );
}
