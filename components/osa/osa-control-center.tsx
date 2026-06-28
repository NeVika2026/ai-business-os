'use client';

import { useState } from 'react';

import {
  controlOsaExecution,
  executeOsaTaskRun,
  type OsaExecutionControlResult,
} from '@/app/(dashboard)/osa/actions';
import type { ExecutionControlAction } from '@/utils/osa/execution-controls';
import { EXECUTION_CONTROL_STATE_LABELS } from '@/utils/osa/execution-controls';
import {
  getExecutionControlAvailabilityFromProgress,
  type ExecutionProgress,
} from '@/utils/osa/execution-progress';

type OsaControlCenterProps = {
  runId: string | null;
  progress: ExecutionProgress | null;
  loading?: boolean;
  onProgressChange?: (progress: ExecutionProgress) => void;
  onExecutionComplete?: () => void;
};

export function OsaControlCenter({
  runId,
  progress,
  loading = false,
  onProgressChange,
  onExecutionComplete,
}: OsaControlCenterProps) {
  const [controlLoading, setControlLoading] = useState<ExecutionControlAction | null>(null);
  const [controlError, setControlError] = useState<string | null>(null);

  if (!runId && !progress) {
    return null;
  }

  const availability = getExecutionControlAvailabilityFromProgress(progress);
  const controlState = progress?.controlState ?? 'active';
  const busy = loading || controlLoading !== null;

  async function handleControl(action: ExecutionControlAction) {
    if (!runId || busy) {
      return;
    }

    setControlLoading(action);
    setControlError(null);

    try {
      const result: OsaExecutionControlResult = await controlOsaExecution(runId, action);

      if (result.status === 'failed') {
        setControlError(result.message);
        return;
      }

      onProgressChange?.(result.progress);

      if (action === 'restart') {
        await executeOsaTaskRun(runId);
        onExecutionComplete?.();
      }
    } catch {
      setControlError('Не удалось выполнить действие');
    } finally {
      setControlLoading(null);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4 sm:p-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Control Center</h2>
          <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            {EXECUTION_CONTROL_STATE_LABELS[controlState]}
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Управление выполнением без изменения Runtime internals
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatusCard label="Execution Status" value={EXECUTION_CONTROL_STATE_LABELS[controlState]} />
        <StatusCard label="Current Stage" value={progress?.currentStage ?? '—'} />
        <StatusCard label="Current Agent" value={progress?.currentAgent ?? '—'} />
      </div>

      <div className="flex flex-wrap gap-2">
        <ControlButton
          label="Pause"
          disabled={!availability.pause || busy || !runId}
          loading={controlLoading === 'pause'}
          onClick={() => handleControl('pause')}
        />
        <ControlButton
          label="Resume"
          disabled={!availability.resume || busy || !runId}
          loading={controlLoading === 'resume'}
          onClick={() => handleControl('resume')}
        />
        <ControlButton
          label="Cancel"
          disabled={!availability.cancel || busy || !runId}
          loading={controlLoading === 'cancel'}
          onClick={() => handleControl('cancel')}
          variant="danger"
        />
        <ControlButton
          label="Retry"
          disabled={!availability.retryTask || busy || !runId}
          loading={controlLoading === 'retry_task'}
          onClick={() => handleControl('retry_task')}
        />
        <ControlButton
          label="Restart"
          disabled={!availability.restart || busy || !runId}
          loading={controlLoading === 'restart'}
          onClick={() => handleControl('restart')}
        />
      </div>

      {controlError ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[var(--text-primary)]">
          {controlError}
        </p>
      ) : null}
    </section>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-1)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function ControlButton({
  label,
  disabled,
  loading,
  onClick,
  variant = 'default',
}: {
  label: string;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
  variant?: 'default' | 'danger';
}) {
  const variantClass =
    variant === 'danger'
      ? 'border-red-500/40 text-red-600 hover:bg-red-500/10'
      : 'border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${variantClass}`}
    >
      {loading ? `${label}...` : label}
    </button>
  );
}
