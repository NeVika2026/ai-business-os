import type {
  AITaskExecutorExecutionReport,
  AITaskExecutorReport,
  AITaskExecutorResult,
  AITaskExecutorSnapshot,
  AITaskExecutorStatusView,
  SerializedAITaskExecutorExecutionReport,
  SerializedAITaskExecutorReport,
  SerializedAITaskExecutorResult,
  SerializedAITaskExecutorSnapshot,
  SerializedAITaskExecutorStatusView,
} from '@/services/automation/ai-task-executor-adapter-types';

export function serializeAITaskExecutorExecutionReport(
  report: AITaskExecutorExecutionReport,
): SerializedAITaskExecutorExecutionReport {
  return {
    taskId: report.taskId,
    title: report.title,
    status: report.status,
    startedAt: report.startedAt,
    finishedAt: report.finishedAt,
    durationMs: report.durationMs,
    filesChanged: [...report.filesChanged],
    warnings: [...report.warnings],
    errors: [...report.errors],
    summary: report.summary ?? null,
  };
}

export function serializeAITaskExecutorResult(
  result: AITaskExecutorResult,
): SerializedAITaskExecutorResult {
  return {
    success: result.success,
    durationMs: result.durationMs,
    filesChanged: [...result.filesChanged],
    warnings: [...result.warnings],
    errors: [...result.errors],
    report: serializeAITaskExecutorExecutionReport(result.report),
    executorName: result.executorName,
    executorVersion: result.executorVersion,
  };
}

export function serializeAITaskExecutorStatusView(
  status: AITaskExecutorStatusView,
): SerializedAITaskExecutorStatusView {
  return {
    state: status.state,
    currentTaskId: status.currentTaskId ?? null,
    executorName: status.executorName,
    executorVersion: status.executorVersion,
    lastSuccess: status.lastSuccess ?? null,
    updatedAt: status.updatedAt,
  };
}

export function serializeAITaskExecutorReport(
  report: AITaskExecutorReport,
): SerializedAITaskExecutorReport {
  return {
    instanceId: report.instanceId,
    state: report.state,
    executorName: report.executorName,
    executorVersion: report.executorVersion,
    executionCount: report.executionCount,
    completedCount: report.completedCount,
    failedCount: report.failedCount,
    cancelledCount: report.cancelledCount,
    lastTaskId: report.lastTaskId ?? null,
    reports: report.reports.map(serializeAITaskExecutorExecutionReport),
  };
}

export function serializeAITaskExecutorSnapshot(input: {
  snapshot: AITaskExecutorSnapshot;
  lastResult: AITaskExecutorResult | null;
  report: AITaskExecutorReport;
}): SerializedAITaskExecutorSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    state: input.snapshot.state,
    executorName: input.snapshot.executorName,
    executorVersion: input.snapshot.executorVersion,
    executionCount: input.snapshot.executionCount,
    lastTaskId: input.snapshot.lastTaskId ?? null,
    lastSuccess: input.snapshot.lastSuccess ?? null,
    updatedAt: input.snapshot.updatedAt,
    lastResult: input.lastResult ? serializeAITaskExecutorResult(input.lastResult) : null,
    report: serializeAITaskExecutorReport(input.report),
  };
}
