import { formatExecutionPlanEta } from '@/utils/osa/execution-planner';
import { getExecutionControlState, type ExecutionControlState } from '@/utils/osa/execution-controls';
import { estimateProgress } from '@/utils/osa/team-execution';
import type { ExecutionSession } from '@/utils/osa/team-runtime';

export type ExecutionProgress = {
  currentTask: string | null;
  currentAgent: string | null;
  currentStage: string | null;
  completedTasks: string[];
  runningTasks: string[];
  failedTasks: string[];
  blockedTasks: string[];
  progress: number;
  eta: number;
  lastUpdate: string;
  controlState: ExecutionControlState;
};

export type ExecutionProgressSnapshot = ExecutionProgress & {
  id: string;
  runId: string | null;
  createdAt: string;
};

function resolveCurrentTask(session: ExecutionSession): {
  taskTitle: string | null;
  agentName: string | null;
} {
  const runningTaskId = session.runningTasks[0] ?? null;

  if (!runningTaskId) {
    return { taskTitle: null, agentName: null };
  }

  const task = session.graph.tasks.find((entry) => entry.id === runningTaskId);

  if (!task) {
    return { taskTitle: runningTaskId, agentName: null };
  }

  const agent = session.selectedAgents.find((entry) => entry.id === task.agentId);

  return {
    taskTitle: task.title,
    agentName: agent?.name ?? task.agentId,
  };
}

function resolveCurrentStageLabel(session: ExecutionSession): string | null {
  if (!session.currentStage) {
    return null;
  }

  const stage = session.graph.stages.find((entry) => entry.id === session.currentStage);

  return stage?.title ?? session.currentStage;
}

export function estimateLiveEta(session: ExecutionSession): number {
  return estimateProgress(session.graph.tasks).eta;
}

export function buildExecutionProgress(
  session: ExecutionSession,
  lastUpdate: string = new Date().toISOString(),
): ExecutionProgress {
  const { taskTitle, agentName } = resolveCurrentTask(session);

  return {
    currentTask: taskTitle,
    currentAgent: agentName,
    currentStage: resolveCurrentStageLabel(session),
    completedTasks: [...session.completedTasks],
    runningTasks: [...session.runningTasks],
    failedTasks: [...session.failedTasks],
    blockedTasks: [...session.blockedTasks],
    progress: session.progress,
    eta: estimateLiveEta(session),
    lastUpdate,
    controlState: getExecutionControlState({ session }),
  };
}

export function updateExecutionProgress(
  _previous: ExecutionProgress | null,
  session: ExecutionSession,
  lastUpdate: string = new Date().toISOString(),
): ExecutionProgress {
  return buildExecutionProgress(session, lastUpdate);
}

export function serializeExecutionProgress(progress: ExecutionProgress): Record<string, unknown> {
  return {
    progress: progress.progress,
    completedTasks: progress.completedTasks,
    runningTasks: progress.runningTasks,
    failedTasks: progress.failedTasks,
    blockedTasks: progress.blockedTasks,
    eta: progress.eta,
    currentTask: progress.currentTask,
    currentAgent: progress.currentAgent,
    currentStage: progress.currentStage,
    lastUpdate: progress.lastUpdate,
    controlState: progress.controlState,
  };
}

export function parseExecutionProgress(value: unknown): ExecutionProgress | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.progress !== 'number') {
    return null;
  }

  return {
    currentTask: typeof record.currentTask === 'string' ? record.currentTask : null,
    currentAgent: typeof record.currentAgent === 'string' ? record.currentAgent : null,
    currentStage: typeof record.currentStage === 'string' ? record.currentStage : null,
    completedTasks: Array.isArray(record.completedTasks) ? (record.completedTasks as string[]) : [],
    runningTasks: Array.isArray(record.runningTasks) ? (record.runningTasks as string[]) : [],
    failedTasks: Array.isArray(record.failedTasks) ? (record.failedTasks as string[]) : [],
    blockedTasks: Array.isArray(record.blockedTasks) ? (record.blockedTasks as string[]) : [],
    progress: record.progress,
    eta: typeof record.eta === 'number' ? record.eta : 0,
    lastUpdate:
      typeof record.lastUpdate === 'string' ? record.lastUpdate : new Date().toISOString(),
    controlState:
      record.controlState === 'active' ||
      record.controlState === 'paused' ||
      record.controlState === 'retrying' ||
      record.controlState === 'cancelled' ||
      record.controlState === 'completed' ||
      record.controlState === 'failed'
        ? record.controlState
        : 'active',
  };
}

export function formatExecutionProgressBar(progress: number, width = 10): string {
  const bounded = Math.max(0, Math.min(100, progress));
  const filled = Math.round((bounded / 100) * width);
  const empty = Math.max(0, width - filled);

  return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${bounded}%`;
}

export function formatExecutionProgressEta(progress: ExecutionProgress): string {
  return formatExecutionPlanEta(progress.eta);
}

export function buildExecutionProgressSnapshot(
  progress: ExecutionProgress,
  options: { id: string; runId?: string | null; createdAt?: string },
): ExecutionProgressSnapshot {
  return {
    ...progress,
    id: options.id,
    runId: options.runId ?? null,
    createdAt: options.createdAt ?? progress.lastUpdate,
  };
}
