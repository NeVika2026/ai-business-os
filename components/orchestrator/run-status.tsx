import type { AgentRunStatus } from '@/types/ai';
import { AGENT_RUN_STATUS_LABELS } from '@/types/ai';

const STATUS_STYLES: Record<AgentRunStatus, string> = {
  pending: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  running: 'bg-sky-500/15 text-sky-300',
  completed: 'bg-emerald-500/15 text-emerald-300',
  failed: 'bg-red-500/15 text-red-300',
  cancelled: 'bg-[var(--surface-2)] text-[var(--text-secondary)]',
};

type RunStatusProps = {
  status: AgentRunStatus;
};

export function RunStatusBadge({ status }: RunStatusProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {AGENT_RUN_STATUS_LABELS[status]}
    </span>
  );
}
