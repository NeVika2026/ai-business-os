import type { AiOrchestraState, OrchestraAgentStatus } from '@/types/ai-orchestra';
import { OsaEmptyState } from '@/components/osa/OsaEmptyState';
import { OsaOrbitLoading } from '@/components/osa/OsaOrbitLoading';
import { orchestraStatusLabel } from '@/lib/project-lifecycle/build-ai-orchestra';
import { OSA_EMPTY_STATES } from '@/utils/osa/empty-states';
import { OSA_LOADING_MESSAGES } from '@/utils/osa/loading-messages';

type AiOrchestraPanelProps = {
  orchestra: AiOrchestraState;
  isPending?: boolean;
  onResolveBlocked?: () => void;
};

function statusTone(status: OrchestraAgentStatus): string {
  switch (status) {
    case 'working':
      return 'text-[var(--accent)]';
    case 'blocked':
      return 'text-amber-600';
    case 'completed':
      return 'text-[var(--text-secondary)]';
    case 'waiting':
      return 'text-[var(--text-tertiary)]';
  }
}

function pulseClass(status: OrchestraAgentStatus): string {
  switch (status) {
    case 'working':
      return 'bg-[var(--accent)] osa-team-pulse';
    case 'blocked':
      return 'bg-amber-500';
    case 'completed':
      return 'bg-[var(--text-secondary)]/40';
    case 'waiting':
      return 'bg-[var(--border-subtle)]';
  }
}

function OrchestraAgentRow({ agent }: { agent: AiOrchestraState['queue'][number] }) {
  return (
    <li className="py-5 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-[15px] font-medium text-[var(--text-primary)]">{agent.name}</p>
            <p className="text-[13px] text-[var(--text-tertiary)]">{agent.role}</p>
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
            {agent.currentActivity}
          </p>
          {agent.blockedReason ? (
            <p className="mt-2 text-[13px] leading-relaxed text-amber-700">{agent.blockedReason}</p>
          ) : null}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--border-subtle)]/60">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-700 ease-out"
                style={{ width: `${agent.progressPercent}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-[12px] tabular-nums text-[var(--text-tertiary)]">
              {agent.progressPercent}%
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 pt-1">
          <span className={`text-[12px] font-medium ${statusTone(agent.status)}`}>
            {orchestraStatusLabel(agent.status)}
          </span>
          <span
            className={`h-2 w-2 rounded-full ${pulseClass(agent.status)}`}
            aria-hidden="true"
          />
        </div>
      </div>
    </li>
  );
}

export function AiOrchestraPanel({ orchestra, isPending = false, onResolveBlocked }: AiOrchestraPanelProps) {
  const blockedAgent = orchestra.queue.find((agent) => agent.status === 'blocked');
  const activeAgent = orchestra.queue.find((agent) => agent.id === orchestra.activeAgentId);

  if (orchestra.queue.length === 0) {
    return (
      <section className="osa-ai-orchestra">
        <OsaEmptyState {...OSA_EMPTY_STATES.orchestra} compact />
      </section>
    );
  }

  return (
    <section className="osa-ai-orchestra" aria-busy={isPending}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            AI Orchestra
          </p>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            {activeAgent
              ? `${activeAgent.role} ведёт текущий этап`
              : 'Executive Brain пересчитывает очередь'}
          </p>
        </div>
        <p className="text-[13px] tabular-nums text-[var(--text-tertiary)]">
          {orchestra.overallProgress}% команды
        </p>
      </div>

      <ul className="mt-6 divide-y divide-[var(--border-subtle)]/70">
        {orchestra.queue.map((agent) => (
          <OrchestraAgentRow key={agent.id} agent={agent} />
        ))}
      </ul>

      {blockedAgent && onResolveBlocked ? (
        <button
          type="button"
          disabled={isPending}
          onClick={onResolveBlocked}
          className="mt-6 inline-flex items-center rounded-full border border-[var(--border-subtle)] px-5 py-2.5 text-[14px] font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'OSA принимает решение…' : 'Подтвердить и продолжить →'}
        </button>
      ) : null}

      {isPending ? (
        <div className="mt-6">
          <OsaOrbitLoading message={OSA_LOADING_MESSAGES.decision} compact />
        </div>
      ) : null}
    </section>
  );
}
