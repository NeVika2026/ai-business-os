import type {
  AutonomousWorkerCommandResult,
  AutonomousWorkerExecutorResult,
  AutonomousWorkerReport,
  AutonomousWorkerSnapshot,
  AutonomousWorkerStatusView,
  AutonomousWorkerTaskReport,
  SerializedAutonomousWorkerCommandResult,
  SerializedAutonomousWorkerExecutorResult,
  SerializedAutonomousWorkerReport,
  SerializedAutonomousWorkerSnapshot,
  SerializedAutonomousWorkerStatusView,
  SerializedAutonomousWorkerTaskReport,
} from '@/services/automation/autonomous-worker-types';

function serializeCommandResult(
  result: AutonomousWorkerCommandResult,
): SerializedAutonomousWorkerCommandResult {
  return {
    success: result.success,
    command: result.command,
    args: [...result.args],
    exitCode: result.exitCode,
    stdout: result.stdout ?? null,
    stderr: result.stderr ?? null,
    errors: [...result.errors],
    warnings: [...result.warnings],
    output: result.output ?? null,
    durationMs: result.durationMs,
  };
}

function serializeExecutorResult(
  result: AutonomousWorkerExecutorResult,
): SerializedAutonomousWorkerExecutorResult {
  return {
    success: result.success,
    files: [...result.files],
    errors: [...result.errors],
    warnings: [...result.warnings],
    output: result.output ?? null,
    durationMs: result.durationMs,
  };
}

export function serializeAutonomousWorkerTaskReport(
  report: AutonomousWorkerTaskReport,
): SerializedAutonomousWorkerTaskReport {
  return {
    taskId: report.taskId,
    sprintId: report.sprintId,
    code: report.code,
    title: report.title,
    status: report.status,
    durationMs: report.durationMs,
    files: [...report.files],
    errors: [...report.errors],
    warnings: [...report.warnings],
    lint: report.lint ? serializeCommandResult(report.lint) : null,
    build: report.build ? serializeCommandResult(report.build) : null,
    tests: report.tests ? serializeCommandResult(report.tests) : null,
    executor: serializeExecutorResult(report.executor),
  };
}

export function serializeAutonomousWorkerReport(
  report: AutonomousWorkerReport,
): SerializedAutonomousWorkerReport {
  return {
    roadmapId: report.roadmapId,
    roadmapTitle: report.roadmapTitle,
    workerState: report.workerState,
    completedTaskCount: report.completedTaskCount,
    failedTaskCount: report.failedTaskCount,
    pendingTaskCount: report.pendingTaskCount,
    currentTaskId: report.currentTaskId ?? null,
    pauseReason: report.pauseReason ?? null,
    stopReason: report.stopReason ?? null,
    taskReports: report.taskReports.map(serializeAutonomousWorkerTaskReport),
    nextRecommendedAction: report.nextRecommendedAction,
  };
}

export function serializeAutonomousWorkerStatusView(
  status: AutonomousWorkerStatusView,
): SerializedAutonomousWorkerStatusView {
  return {
    state: status.state,
    roadmapId: status.roadmapId ?? null,
    roadmapTitle: status.roadmapTitle ?? null,
    currentTaskId: status.currentTaskId ?? null,
    completedTaskCount: status.completedTaskCount,
    failedTaskCount: status.failedTaskCount,
    pendingTaskCount: status.pendingTaskCount,
    pauseReason: status.pauseReason ?? null,
    stopReason: status.stopReason ?? null,
    startedAt: status.startedAt ?? null,
    updatedAt: status.updatedAt,
  };
}

export function serializeAutonomousWorkerSnapshot(input: {
  snapshot: AutonomousWorkerSnapshot;
  report: AutonomousWorkerReport | null;
}): SerializedAutonomousWorkerSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    state: input.snapshot.state,
    roadmapId: input.snapshot.roadmapId ?? null,
    roadmapTitle: input.snapshot.roadmapTitle ?? null,
    currentTaskId: input.snapshot.currentTaskId ?? null,
    completedTaskCount: input.snapshot.completedTaskCount,
    failedTaskCount: input.snapshot.failedTaskCount,
    pendingTaskCount: input.snapshot.pendingTaskCount,
    pauseReason: input.snapshot.pauseReason ?? null,
    stopReason: input.snapshot.stopReason ?? null,
    startedAt: input.snapshot.startedAt ?? null,
    updatedAt: input.snapshot.updatedAt,
    report: input.report ? serializeAutonomousWorkerReport(input.report) : null,
  };
}
