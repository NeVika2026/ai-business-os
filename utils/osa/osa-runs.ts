import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import { OSA_EVENT_SOURCE } from '@/utils/osa/osa-run-persistence';
import { parseExecutionGraph, type ExecutionGraph } from '@/utils/osa/team-execution';
import { parseExecutionSession, type ExecutionSession } from '@/utils/osa/team-runtime';

export const OSA_RUN_ACTION = 'osa_task';
export const OSA_RUN_SOURCE = 'osa_workspace';
export const OSA_RUN_HISTORY_LIMIT = 20;

export function isOsaRun(run: Pick<OrchestratorRun, 'input'>): boolean {
  return run.input.action === OSA_RUN_ACTION || run.input.source === OSA_RUN_SOURCE;
}

export function getOsaRunGoal(run: OrchestratorRun): string {
  const prompt = run.input.user_prompt;

  if (typeof prompt === 'string' && prompt.trim().length > 0) {
    return prompt.trim();
  }

  return '—';
}

export function getOsaRunTeam(run: OrchestratorRun): string {
  const trace = run.input.agent_trace;

  if (Array.isArray(trace)) {
    const labels = trace.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );

    if (labels.length > 0) {
      return labels.join(' → ');
    }
  }

  const agents = run.input.selected_agents;

  if (Array.isArray(agents)) {
    const names = agents
      .map((agent) => {
        if (!agent || typeof agent !== 'object') {
          return null;
        }

        const name = (agent as { name?: unknown }).name;
        return typeof name === 'string' && name.trim().length > 0 ? name.trim() : null;
      })
      .filter((name): name is string => name !== null);

    if (names.length > 0) {
      return names.join(' → ');
    }
  }

  return '—';
}

export function getOsaRuntimeMode(run: OrchestratorRun): string {
  const outputSimulated = run.output?.simulated;
  const inputSimulated = run.input.simulated;

  if (outputSimulated === true || inputSimulated === true) {
    return 'Demo';
  }

  if (run.input.runtime_bridge_enabled === true || run.output?.runtime_bridge_enabled === true) {
    return 'Runtime';
  }

  return 'Demo';
}

export function getOsaExecutionGraph(run: OrchestratorRun): ExecutionGraph | null {
  return parseExecutionGraph(run.input.execution_graph ?? run.input.executionGraph);
}

export function getOsaExecutionSession(run: OrchestratorRun): ExecutionSession | null {
  const fromInput = parseExecutionSession(
    run.input.execution_session ?? run.input.executionSession,
  );
  const fromOutput = parseExecutionSession(
    run.output?.execution_session ?? run.output?.executionSession,
  );

  return fromOutput ?? fromInput;
}

export function groupEventsByRunId(
  events: OrchestratorEvent[],
): Record<string, OrchestratorEvent[]> {
  return events.reduce<Record<string, OrchestratorEvent[]>>((groups, event) => {
    const runId = event.correlation_id;

    if (!runId) {
      return groups;
    }

    const existing = groups[runId] ?? [];
    existing.push(event);
    groups[runId] = existing;
    return groups;
  }, {});
}

export function filterOsaTimelineEvents(events: OrchestratorEvent[]): OrchestratorEvent[] {
  return events.filter((event) => event.source === OSA_EVENT_SOURCE);
}

export const OSA_RUN_HISTORY_EVENT_SELECT = `
  id,
  organization_id,
  type,
  source,
  actor_type,
  actor_id,
  payload,
  correlation_id,
  created_at
`;
