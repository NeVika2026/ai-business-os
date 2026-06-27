import type { OrchestratorEvent } from '@/types/orchestrator';
import { ORCHESTRATOR_EVENT_LABELS, ORCHESTRATOR_EVENT_TYPES } from '@/types/orchestrator';
import { formatDateTime } from '@/utils/orchestrator/runs';

type RunTimelineProps = {
  events: OrchestratorEvent[];
};

function getEventLabel(type: string) {
  if (ORCHESTRATOR_EVENT_TYPES.includes(type as (typeof ORCHESTRATOR_EVENT_TYPES)[number])) {
    return ORCHESTRATOR_EVENT_LABELS[type as keyof typeof ORCHESTRATOR_EVENT_LABELS];
  }

  return type;
}

export function RunTimeline({ events }: RunTimelineProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Event Timeline</h2>
        <p className="text-sm text-[var(--text-secondary)]">Events for this run</p>
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
