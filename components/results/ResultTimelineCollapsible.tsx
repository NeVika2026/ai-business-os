import { formatDateTime } from '@/utils/orchestrator/runs';
import type { ResultTimelineEntry } from '@/utils/results/result-mappers';

type ResultTimelineCollapsibleProps = {
  timeline: ResultTimelineEntry[];
};

export function ResultTimelineCollapsible({ timeline }: ResultTimelineCollapsibleProps) {
  if (timeline.length === 0) {
    return null;
  }

  return (
    <details className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-5 py-4">
      <summary className="cursor-pointer text-sm font-medium text-[var(--text-secondary)]">
        Timeline
      </summary>
      <ol className="mt-4 space-y-3">
        {timeline.map((entry) => (
          <li key={entry.id} className="border-l-2 border-[var(--accent)]/40 pl-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">{entry.label}</p>
              <time className="text-xs text-[var(--text-secondary)]">
                {formatDateTime(entry.timestamp)}
              </time>
            </div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{entry.detail}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
