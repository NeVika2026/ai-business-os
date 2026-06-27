import type {
  CommandRunResult,
  CommandRunnerSnapshot,
  SerializedCommandRunResult,
  SerializedCommandRunnerSnapshot,
} from '@/services/automation/command-runner-types';

export function serializeCommandRunResult(result: CommandRunResult): SerializedCommandRunResult {
  return {
    command: result.command,
    args: [...result.args],
    cwd: result.cwd ?? null,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    durationMs: result.durationMs,
    success: result.success,
    timedOut: result.timedOut,
  };
}

export function serializeCommandRunnerSnapshot(input: {
  snapshot: CommandRunnerSnapshot;
  lastResult: CommandRunResult | null;
}): SerializedCommandRunnerSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    defaultCwd: input.snapshot.defaultCwd ?? null,
    timeoutMs: input.snapshot.timeoutMs,
    lastCommand: input.snapshot.lastCommand ?? null,
    lastArgs: [...input.snapshot.lastArgs],
    lastCwd: input.snapshot.lastCwd ?? null,
    lastExitCode: input.snapshot.lastExitCode ?? null,
    lastDurationMs: input.snapshot.lastDurationMs ?? null,
    lastSuccess: input.snapshot.lastSuccess ?? null,
    runCount: input.snapshot.runCount,
    updatedAt: input.snapshot.updatedAt,
    lastResult: input.lastResult ? serializeCommandRunResult(input.lastResult) : null,
  };
}
