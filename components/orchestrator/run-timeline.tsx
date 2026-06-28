import type { OrchestratorEvent } from '@/types/orchestrator';
import { RUN_EVENT_LABELS } from '@/types/orchestrator';
import { formatExecutionPlanEta } from '@/utils/osa/execution-planner';
import {
  formatExecutionProgressBar,
  formatExecutionProgressEta,
  parseExecutionProgress,
} from '@/utils/osa/execution-progress';
import { formatDateTime } from '@/utils/orchestrator/runs';

type RunTimelineProps = {
  events: OrchestratorEvent[];
  title?: string;
  description?: string;
};

function getEventLabel(type: string) {
  return RUN_EVENT_LABELS[type] ?? type;
}

function renderExecutionPlanPayload(payload: Record<string, unknown>) {
  const stages = Array.isArray(payload.stages) ? payload.stages : [];
  const estimatedMinutes =
    typeof payload.estimatedMinutes === 'number' ? payload.estimatedMinutes : null;
  const executionMode =
    typeof payload.executionMode === 'string' ? payload.executionMode : 'sequential';
  const reviewRequired = payload.reviewRequired === true;
  const risks = Array.isArray(payload.risks) ? payload.risks : [];

  return (
    <div className="mt-3 space-y-3 rounded-lg bg-[var(--surface-1)] p-3 text-sm text-[var(--text-primary)]">
      <p className="text-[var(--text-secondary)]">
        {estimatedMinutes !== null ? `ETA: ${formatExecutionPlanEta(estimatedMinutes)}` : 'ETA: —'}
        {' · '}
        {stages.length} stage{stages.length === 1 ? '' : 's'}
        {' · '}
        Mode: {executionMode}
        {reviewRequired ? ' · Review required' : ''}
      </p>
      <ol className="space-y-2">
        {stages.map((stage, index) => {
          if (!stage || typeof stage !== 'object') {
            return null;
          }

          const record = stage as Record<string, unknown>;
          const title = typeof record.title === 'string' ? record.title : `Stage ${index + 1}`;
          const minutes =
            typeof record.estimatedMinutes === 'number' ? record.estimatedMinutes : null;

          return (
            <li key={typeof record.id === 'string' ? record.id : `stage-${index}`}>
              <span className="font-medium">{title}</span>
              {minutes !== null ? (
                <span className="text-[var(--text-secondary)]"> · {minutes} мин</span>
              ) : null}
            </li>
          );
        })}
      </ol>
      {risks.length > 0 ? (
        <p className="text-xs text-[var(--text-secondary)]">
          Risks: {risks.length}
          {risks.slice(0, 2).map((risk, index) => {
            if (!risk || typeof risk !== 'object') {
              return null;
            }

            const record = risk as Record<string, unknown>;
            const title = typeof record.title === 'string' ? record.title : 'Risk';

            return (
              <span key={typeof record.id === 'string' ? record.id : `risk-${index}`}>
                {index === 0 ? ' · ' : ' · '}
                {title}
              </span>
            );
          })}
        </p>
      ) : null}
    </div>
  );
}

function renderProgressPayload(payload: Record<string, unknown>) {
  const progress = parseExecutionProgress(payload);

  if (!progress) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg bg-[var(--surface-1)] p-3 text-sm text-[var(--text-primary)]">
      <p className="font-mono">{formatExecutionProgressBar(progress.progress)}</p>
      <p className="text-[var(--text-secondary)]">
        {progress.currentAgent ?? '—'} · {progress.currentTask ?? '—'} ·{' '}
        {progress.currentStage ?? '—'}
      </p>
      <p className="text-xs text-[var(--text-secondary)]">
        Completed {progress.completedTasks.length} · Running {progress.runningTasks.length} · Failed{' '}
        {progress.failedTasks.length} · Blocked {progress.blockedTasks.length} · ETA{' '}
        {formatExecutionProgressEta(progress)}
      </p>
    </div>
  );
}

function renderControlPayload(payload: Record<string, unknown>) {
  const action = typeof payload.action === 'string' ? payload.action : null;
  const taskId = typeof payload.task_id === 'string' ? payload.task_id : null;
  const stageId = typeof payload.stage_id === 'string' ? payload.stage_id : null;
  const controlState = typeof payload.control_state === 'string' ? payload.control_state : null;

  return (
    <div className="mt-3 space-y-1 rounded-lg bg-[var(--surface-1)] p-3 text-sm text-[var(--text-primary)]">
      {action ? <p>Action: {action.replace('_', ' ')}</p> : null}
      {taskId ? <p className="text-[var(--text-secondary)]">Task: {taskId}</p> : null}
      {stageId ? <p className="text-[var(--text-secondary)]">Stage: {stageId}</p> : null}
      {controlState ? (
        <p className="text-xs text-[var(--text-secondary)]">Session state: {controlState}</p>
      ) : null}
    </div>
  );
}

function renderEventPayload(event: OrchestratorEvent) {
  if (event.type === 'osa_execution_plan_created') {
    return renderExecutionPlanPayload(event.payload);
  }

  if (event.type === 'osa_progress_updated') {
    return renderProgressPayload(event.payload);
  }

  if (
    event.type === 'osa_execution_paused' ||
    event.type === 'osa_execution_resumed' ||
    event.type === 'osa_execution_cancelled' ||
    event.type === 'osa_execution_restarted' ||
    event.type === 'osa_execution_retry'
  ) {
    return renderControlPayload(event.payload);
  }

  if (Object.keys(event.payload).length === 0) {
    return null;
  }

  return (
    <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--surface-1)] p-3 text-xs text-[var(--text-primary)]">
      {JSON.stringify(event.payload, null, 2)}
    </pre>
  );
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
              {renderEventPayload(event)}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
