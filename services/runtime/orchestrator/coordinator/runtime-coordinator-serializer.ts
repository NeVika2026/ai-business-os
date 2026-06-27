import type {
  CoordinatorRecord,
  CoordinatorStatus,
  SerializedCoordinatorSnapshot,
  SerializedCoordinatorTask,
} from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-types';
import { resolveCurrentTask } from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-scheduler';
import type { OrchestratorRuntime } from '@/services/runtime/orchestrator/engine/runtime-orchestrator-types';
import type { OrchestratorTask } from '@/services/runtime/orchestrator/engine/runtime-orchestrator-types';
import type { RuntimeState } from '@/services/runtime/orchestrator/state/runtime-state-types';

function serializeTask(task: OrchestratorTask): SerializedCoordinatorTask {
  return {
    id: task.id,
    type: task.type,
    priority: task.priority,
    dependsOn: [...task.dependsOn],
  };
}

export function serializeCoordinatorSnapshot(
  record: CoordinatorRecord,
  runtime: OrchestratorRuntime,
  state: RuntimeState,
): SerializedCoordinatorSnapshot {
  const currentTask = resolveCurrentTask(runtime.currentTaskId, record.taskCatalog);

  return {
    runtime: {
      id: runtime.id,
      organizationId: runtime.organizationId,
      employeeId: runtime.employeeId,
      runId: runtime.runId,
      traceId: runtime.traceId,
      status: runtime.status,
      currentTaskId: runtime.currentTaskId,
      pendingTasks: runtime.pendingTasks.map(serializeTask),
      completedTaskIds: [...runtime.completedTaskIds],
      failedTaskIds: [...runtime.failedTaskIds],
      plannedOrder: [...runtime.plannedOrder],
      paused: runtime.paused,
      pauseReason: runtime.pauseReason,
      cancelled: runtime.cancelled,
      cancelReason: runtime.cancelReason,
      result: runtime.result,
      error: runtime.error,
      createdAt: runtime.createdAt,
      updatedAt: runtime.updatedAt,
    },
    state,
    queue: runtime.pendingTasks.map(serializeTask),
    currentTask: currentTask ? serializeTask(currentTask) : null,
    status: record.status,
  };
}

export function mapOrchestratorStatusToCoordinator(
  orchestratorStatus: OrchestratorRuntime['status'],
  fallback: CoordinatorStatus,
): CoordinatorStatus {
  switch (orchestratorStatus) {
    case 'paused':
      return 'paused';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    case 'running':
      return 'running';
    default:
      return fallback;
  }
}
