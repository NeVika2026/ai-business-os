import type {
  RealTaskExecutionReportEntry,
  RealTaskExecutionResult,
  RealTaskHandlerReport,
  RealTaskHandlerSnapshot,
  RealTaskOperation,
  SerializedRealTaskExecutionReportEntry,
  SerializedRealTaskExecutionResult,
  SerializedRealTaskHandlerReport,
  SerializedRealTaskHandlerSnapshot,
  SerializedRealTaskOperation,
} from '@/services/automation/real-task-handler-types';

function serializeOperation(operation: RealTaskOperation): SerializedRealTaskOperation {
  return {
    id: operation.id,
    type: operation.type,
    path: operation.path,
    targetPath: operation.targetPath ?? null,
    content: operation.content ?? null,
    search: operation.search ?? null,
    replacement: operation.replacement ?? null,
  };
}

export function serializeRealTaskExecutionReportEntry(
  report: RealTaskExecutionReportEntry,
): SerializedRealTaskExecutionReportEntry {
  return {
    taskId: report.taskId,
    taskTitle: report.taskTitle,
    operations: report.operations.map(serializeOperation),
    durationMs: report.durationMs,
    filesChanged: [...report.filesChanged],
    filesCreated: [...report.filesCreated],
    filesModified: [...report.filesModified],
    filesDeleted: [...report.filesDeleted],
    warnings: [...report.warnings],
    errors: [...report.errors],
    rollbackStatus: report.rollbackStatus,
    startedAt: report.startedAt,
    finishedAt: report.finishedAt,
  };
}

export function serializeRealTaskExecutionResult(
  result: RealTaskExecutionResult,
): SerializedRealTaskExecutionResult {
  return {
    success: result.success,
    durationMs: result.durationMs,
    filesCreated: [...result.filesCreated],
    filesModified: [...result.filesModified],
    filesDeleted: [...result.filesDeleted],
    warnings: [...result.warnings],
    errors: [...result.errors],
    rollbackAvailable: result.rollbackAvailable,
  };
}

export function serializeRealTaskHandlerReport(
  report: RealTaskHandlerReport,
): SerializedRealTaskHandlerReport {
  return {
    instanceId: report.instanceId,
    executionCount: report.executionCount,
    reports: report.reports.map(serializeRealTaskExecutionReportEntry),
  };
}

export function serializeRealTaskHandlerSnapshot(input: {
  snapshot: RealTaskHandlerSnapshot;
  lastResult: RealTaskExecutionResult | null;
  report: RealTaskHandlerReport;
}): SerializedRealTaskHandlerSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    rootDir: input.snapshot.rootDir,
    executionCount: input.snapshot.executionCount,
    lastTaskId: input.snapshot.lastTaskId ?? null,
    lastSuccess: input.snapshot.lastSuccess ?? null,
    updatedAt: input.snapshot.updatedAt,
    lastResult: input.lastResult ? serializeRealTaskExecutionResult(input.lastResult) : null,
    report: serializeRealTaskHandlerReport(input.report),
  };
}
