import { formatDateTime } from '@/utils/orchestrator/runs';
import type { ResultTimelineEntry } from '@/utils/results/result-mappers';

type ResultTimelineProps = {
  timeline: ResultTimelineEntry[];
};

export function ResultTimeline({ timeline }: ResultTimelineProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Timeline</h2>
        <p className="text-sm text-[var(--text-secondary)]">How this result progressed</p>
      </div>

      {timeline.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
          No timeline entries yet.
        </div>
      ) : (
        <ol className="space-y-3">
          {timeline.map((entry) => (
            <li
              key={entry.id}
              className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 pl-8"
            >
              <span className="absolute left-3 top-5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-[var(--text-primary)]">{entry.label}</p>
                <time className="text-xs text-[var(--text-secondary)]">
                  {formatDateTime(entry.timestamp)}
                </time>
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{entry.detail}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
