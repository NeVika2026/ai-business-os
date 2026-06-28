import type { OrchestratorEvent } from '@/types/orchestrator';
import { RUN_EVENT_LABELS } from '@/types/orchestrator';
import { formatDateTime } from '@/utils/orchestrator/runs';

type RunTimelineProps = {
  events: OrchestratorEvent[];
  title?: string;
  description?: string;
};

function getEventLabel(type: string) {
  return RUN_EVENT_LABELS[type] ?? type;
}

export function RunTimeline({
  events,
  title = 'Event Timeline',
  description = 'Events for this run',
}: RunTimelineProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
          События не найдены.
        </div>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4 pl-8"
            >
              <span className="absolute left-3 top-5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-[var(--text-primary)]">
                  {getEventLabel(event.type)}
                </p>
                <time className="text-xs text-[var(--text-secondary)]">
                  {formatDateTime(event.created_at)}
                </time>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Source: {event.source} · Actor: {event.actor_type}
              </p>
              {Object.keys(event.payload).length > 0 ? (
                <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--surface-1)] p-3 text-xs text-[var(--text-primary)]">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
