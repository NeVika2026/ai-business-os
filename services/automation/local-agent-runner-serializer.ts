import type {
  LocalAgentExecutionResult,
  LocalAgentRunnerSnapshot,
  LocalAgentRunnerStatusView,
  SerializedLocalAgentExecutionResult,
  SerializedLocalAgentRunnerSnapshot,
  SerializedLocalAgentRunnerStatusView,
} from '@/services/automation/local-agent-runner-types';

export function serializeLocalAgentExecutionResult(
  result: LocalAgentExecutionResult,
): SerializedLocalAgentExecutionResult {
  return {
    success: result.success,
    backend: result.backend,
    durationMs: result.durationMs,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    filesChanged: [...result.filesChanged],
    warnings: [...result.warnings],
    errors: [...result.errors],
    report: result.report ?? null,
  };
}

export function serializeLocalAgentRunnerStatusView(
  status: LocalAgentRunnerStatusView,
): SerializedLocalAgentRunnerStatusView {
  return {
    state: status.state,
    backend: status.backend,
    currentTaskId: status.currentTaskId ?? null,
    lastSuccess: status.lastSuccess ?? null,
    updatedAt: status.updatedAt,
  };
}

export function serializeLocalAgentRunnerSnapshot(input: {
  snapshot: LocalAgentRunnerSnapshot;
  lastResult: LocalAgentExecutionResult | null;
  status: LocalAgentRunnerStatusView;
}): SerializedLocalAgentRunnerSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    backend: input.snapshot.backend,
    state: input.snapshot.state,
    timeoutMs: input.snapshot.timeoutMs,
    defaultWorkingDirectory: input.snapshot.defaultWorkingDirectory ?? null,
    executionCount: input.snapshot.executionCount,
    lastTaskId: input.snapshot.lastTaskId ?? null,
    lastSuccess: input.snapshot.lastSuccess ?? null,
    updatedAt: input.snapshot.updatedAt,
    lastResult: input.lastResult ? serializeLocalAgentExecutionResult(input.lastResult) : null,
    status: serializeLocalAgentRunnerStatusView(input.status),
  };
}
