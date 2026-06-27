import type {
  RuntimeExecutionReport,
  RuntimeExecutionSnapshot,
  SerializedRuntimeExecutionReport,
  SerializedRuntimeExecutionSnapshot,
} from '@/services/runtime/runtime-execution-types';

export function serializeRuntimeExecutionReport(
  report: RuntimeExecutionReport,
): SerializedRuntimeExecutionReport {
  return {
    runId: report.runId,
    status: report.status,
    stageCount: report.stageCount,
    toolCallCount: report.toolCallCount,
    gatewayCallCount: report.gatewayCallCount,
    inputTokens: report.inputTokens,
    outputTokens: report.outputTokens,
    errorCode: report.errorCode,
    errorMessage: report.errorMessage,
    errorStage: report.errorStage,
    stages: report.stages.map((stage) => ({
      stage: stage.stage,
      status: stage.status,
      durationMs: stage.durationMs,
    })),
    completedAt: report.completedAt,
  };
}

export function serializeRuntimeExecutionSnapshot(
  snapshot: RuntimeExecutionSnapshot,
): SerializedRuntimeExecutionSnapshot {
  return {
    lastOperation: snapshot.lastOperation,
    lastRunId: snapshot.lastRunId,
    lastStatus: snapshot.lastStatus,
    lastEmployeeId: snapshot.lastEmployeeId,
    stageCount: snapshot.stageCount,
    updatedAt: snapshot.updatedAt,
  };
}
