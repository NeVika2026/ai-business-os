import type {
  OrchestratorRuntime,
  SerializedOrchestratorRuntime,
} from '@/services/runtime/orchestrator/engine/runtime-orchestrator-types';

export function serializeOrchestratorRuntime(
  runtime: OrchestratorRuntime,
): SerializedOrchestratorRuntime {
  return {
    id: runtime.id,
    organizationId: runtime.organizationId,
    employeeId: runtime.employeeId,
    runId: runtime.runId,
    traceId: runtime.traceId,
    status: runtime.status,
    currentTaskId: runtime.currentTaskId,
    pendingTasks: runtime.pendingTasks.map((task) => ({
      id: task.id,
      type: task.type,
      priority: task.priority,
      dependsOn: [...task.dependsOn],
    })),
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
  };
}
