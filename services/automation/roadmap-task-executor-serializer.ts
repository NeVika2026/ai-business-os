import type {
  RoadmapTaskExecutionReport,
  RoadmapTaskExecutorReport,
  RoadmapTaskExecutorResult,
  RoadmapTaskExecutorSnapshot,
  SerializedRoadmapTaskExecutionReport,
  SerializedRoadmapTaskExecutorReport,
  SerializedRoadmapTaskExecutorResult,
  SerializedRoadmapTaskExecutorSnapshot,
} from '@/services/automation/roadmap-task-executor-types';

export function serializeRoadmapTaskExecutionReport(
  report: RoadmapTaskExecutionReport,
): SerializedRoadmapTaskExecutionReport {
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
  };
}

export function serializeRoadmapTaskExecutorResult(
  result: RoadmapTaskExecutorResult,
): SerializedRoadmapTaskExecutorResult {
  return {
    success: result.success,
    durationMs: result.durationMs,
    filesChanged: [...result.filesChanged],
    warnings: [...result.warnings],
    errors: [...result.errors],
    report: serializeRoadmapTaskExecutionReport(result.report),
  };
}

export function serializeRoadmapTaskExecutorReport(
  report: RoadmapTaskExecutorReport,
): SerializedRoadmapTaskExecutorReport {
  return {
    instanceId: report.instanceId,
    registeredTaskCount: report.registeredTaskCount,
    executedTaskCount: report.executedTaskCount,
    completedTaskCount: report.completedTaskCount,
    failedTaskCount: report.failedTaskCount,
    reports: report.reports.map(serializeRoadmapTaskExecutionReport),
  };
}

export function serializeRoadmapTaskExecutorSnapshot(input: {
  snapshot: RoadmapTaskExecutorSnapshot;
  lastResult: RoadmapTaskExecutorResult | null;
  report: RoadmapTaskExecutorReport;
}): SerializedRoadmapTaskExecutorSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    registeredTaskCount: input.snapshot.registeredTaskCount,
    executedTaskCount: input.snapshot.executedTaskCount,
    completedTaskCount: input.snapshot.completedTaskCount,
    failedTaskCount: input.snapshot.failedTaskCount,
    lastTaskId: input.snapshot.lastTaskId ?? null,
    lastSuccess: input.snapshot.lastSuccess ?? null,
    updatedAt: input.snapshot.updatedAt,
    lastResult: input.lastResult ? serializeRoadmapTaskExecutorResult(input.lastResult) : null,
    report: serializeRoadmapTaskExecutorReport(input.report),
  };
}
