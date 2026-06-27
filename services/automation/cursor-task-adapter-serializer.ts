import type {
  CursorExecutionPackage,
  CursorTaskAdapterReport,
  CursorTaskAdapterReportEntry,
  CursorTaskAdapterSnapshot,
  CursorTaskExecutionResult,
  SerializedCursorExecutionPackage,
  SerializedCursorTaskAdapterReport,
  SerializedCursorTaskAdapterReportEntry,
  SerializedCursorTaskAdapterSnapshot,
  SerializedCursorTaskExecutionResult,
} from '@/services/automation/cursor-task-adapter-types';

function serializePackage(pkg: CursorExecutionPackage): SerializedCursorExecutionPackage {
  return {
    taskId: pkg.taskId,
    title: pkg.title,
    prompt: pkg.prompt,
    allowedPaths: [...pkg.allowedPaths],
    forbiddenPaths: [...pkg.forbiddenPaths],
    requiredChecks: [...pkg.requiredChecks],
    outputFormat: pkg.outputFormat,
    acceptanceCriteria: [...pkg.acceptanceCriteria],
    status: pkg.status,
    preparedAt: pkg.preparedAt,
  };
}

function serializeReportEntry(
  entry: CursorTaskAdapterReportEntry,
): SerializedCursorTaskAdapterReportEntry {
  return {
    taskId: entry.taskId,
    title: entry.title,
    status: entry.status,
    prompt: entry.prompt,
    summary: entry.summary,
    preparedAt: entry.preparedAt,
  };
}

export function serializeCursorTaskExecutionResult(
  result: CursorTaskExecutionResult,
): SerializedCursorTaskExecutionResult {
  return {
    success: result.success,
    status: result.status,
    durationMs: result.durationMs,
    prompt: result.prompt,
    package: serializePackage(result.package),
    summary: result.summary,
  };
}

export function serializeCursorTaskAdapterReport(
  report: CursorTaskAdapterReport,
): SerializedCursorTaskAdapterReport {
  return {
    instanceId: report.instanceId,
    preparedCount: report.preparedCount,
    lastTaskId: report.lastTaskId ?? null,
    entries: report.entries.map(serializeReportEntry),
  };
}

export function serializeCursorTaskAdapterSnapshot(input: {
  snapshot: CursorTaskAdapterSnapshot;
  lastResult: CursorTaskExecutionResult | null;
  report: CursorTaskAdapterReport;
}): SerializedCursorTaskAdapterSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    preparedCount: input.snapshot.preparedCount,
    lastTaskId: input.snapshot.lastTaskId ?? null,
    lastPrompt: input.snapshot.lastPrompt ?? null,
    updatedAt: input.snapshot.updatedAt,
    lastResult: input.lastResult ? serializeCursorTaskExecutionResult(input.lastResult) : null,
    report: serializeCursorTaskAdapterReport(input.report),
  };
}
