import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import { createAITaskExecutorAdapter } from '@/services/automation/ai-task-executor-adapter';
import type { AITaskExecutorTask } from '@/services/automation/ai-task-executor-adapter-types';
import {
  createLocalAgentBackend,
  createLocalAgentRunner,
  fromAITaskExecutorTaskToPackage,
} from '@/services/automation/local-agent-runner';
import {
  LocalAgentRunnerInvalidStateError,
  LocalAgentRunnerValidationError,
} from '@/services/automation/local-agent-runner-errors';
import type {
  LocalAgentBackendKind,
  LocalAgentExecutionPackage,
} from '@/services/automation/local-agent-runner-types';

function createPackage(
  workingDirectory: string,
  overrides?: Partial<LocalAgentExecutionPackage>,
): LocalAgentExecutionPackage {
  return {
    taskId: 'local-task-1',
    title: 'Local Agent Task',
    prompt: 'Implement the local agent runner task.',
    workingDirectory,
    allowedPaths: ['services/automation/local-task-1.ts'],
    forbiddenPaths: ['services/runtime/'],
    metadata: {},
    ...overrides,
  };
}

function createAITask(overrides?: Partial<AITaskExecutorTask>): AITaskExecutorTask {
  return {
    id: 'local-task-1',
    title: 'Local Agent Task',
    description: 'Implement the local agent runner task.',
    acceptanceCriteria: ['Runner executes through mock backend'],
    files: ['services/automation/local-task-1.ts'],
    dependencies: [],
    status: 'idle',
    metadata: {},
    ...overrides,
  };
}

describe('LocalAgentRunner', () => {
  it('executes through the mock backend with deterministic success', () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), 'local-agent-mock-'));

    try {
      const runner = createLocalAgentRunner({
        instanceId: 'local-agent-mock',
        backend: 'mock',
        workingDirectory: rootDir,
      });
      const result = runner.execute(createPackage(rootDir));

      assert.equal(result.success, true);
      assert.equal(result.backend, 'mock');
      assert.equal(result.exitCode, 0);
      assert.match(result.stdout, /mock executed local-task-1/);
      assert.deepEqual(result.filesChanged, ['services/automation/local-task-1.ts']);
      assert.equal(result.errors.length, 0);
      assert.equal(runner.status().state, 'completed');
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('executes through the generic-cli backend using an injected executable', () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), 'local-agent-generic-'));

    try {
      const runner = createLocalAgentRunner({
        instanceId: 'local-agent-generic',
        backend: 'generic-cli',
        workingDirectory: rootDir,
        genericCliExecutable: 'node',
        genericCliArgs: ['-e', 'console.log(process.argv.at(-1) || "")'],
      });
      const result = runner.execute(createPackage(rootDir, { prompt: 'generic-cli-ok' }));

      assert.equal(result.success, true);
      assert.equal(result.backend, 'generic-cli');
      assert.match(result.stdout, /generic-cli-ok/);
      assert.equal(result.exitCode, 0);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('returns not installed for stub backends', () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), 'local-agent-stub-'));

    try {
      const runner = createLocalAgentRunner({
        instanceId: 'local-agent-cursor-stub',
        backend: 'cursor',
        workingDirectory: rootDir,
      });
      const result = runner.execute(createPackage(rootDir));

      assert.equal(result.success, false);
      assert.equal(result.backend, 'cursor');
      assert.deepEqual(result.errors, ['cursor: not installed']);
      assert.equal(result.exitCode, 127);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('rejects unsupported backends during runner creation', () => {
    assert.throws(
      () =>
        createLocalAgentRunner({
          backend: 'unknown-backend' as LocalAgentBackendKind,
        }),
      (error: unknown) => error instanceof LocalAgentRunnerValidationError,
    );
  });

  it('rejects invalid package input during validation', () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), 'local-agent-validate-'));
    const runner = createLocalAgentRunner({
      instanceId: 'local-agent-validate',
      backend: 'mock',
      workingDirectory: rootDir,
    });

    try {
      assert.throws(
        () => runner.validate(createPackage(rootDir, { prompt: '   ' })),
        (error: unknown) => error instanceof LocalAgentRunnerValidationError,
      );

      assert.throws(
        () => runner.validate(createPackage(rootDir, { taskId: '   ' })),
        (error: unknown) => error instanceof LocalAgentRunnerValidationError,
      );

      assert.throws(
        () => runner.validate(createPackage(rootDir, { workingDirectory: '/path/does/not/exist' })),
        (error: unknown) => error instanceof LocalAgentRunnerValidationError,
      );
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('serializes runner state with null instead of undefined', () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), 'local-agent-serialize-'));

    try {
      const runner = createLocalAgentRunner({
        instanceId: 'local-agent-serialize',
        backend: 'mock',
        workingDirectory: rootDir,
      });
      runner.execute(createPackage(rootDir));

      const snapshot = runner.serialize();

      assert.equal(snapshot.instanceId, 'local-agent-serialize');
      assert.equal(snapshot.executionCount, 1);
      assert.equal(snapshot.lastTaskId, 'local-task-1');
      assert.equal(snapshot.lastSuccess, true);
      assert.ok(snapshot.lastResult);
      assert.equal(snapshot.status.currentTaskId, null);

      runner.reset();
      const resetSnapshot = runner.serialize();
      assert.equal(resetSnapshot.executionCount, 0);
      assert.equal(resetSnapshot.lastResult, null);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('lists all available backends', () => {
    const runner = createLocalAgentRunner({ instanceId: 'local-agent-backends' });

    assert.deepEqual(runner.availableBackends(), [
      'mock',
      'generic-cli',
      'cursor',
      'claude-code',
      'codex',
    ]);
  });

  it('rejects cancel when the runner is idle', () => {
    const runner = createLocalAgentRunner({ instanceId: 'local-agent-cancel-idle' });

    assert.throws(
      () => runner.cancel(),
      (error: unknown) => error instanceof LocalAgentRunnerInvalidStateError,
    );
  });
});

describe('LocalAgentRunner adapter integration', () => {
  it('executes through ai-task-executor-adapter with backend local-agent', () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), 'local-agent-adapter-'));

    try {
      const runner = createLocalAgentRunner({
        instanceId: 'local-agent-adapter-runner',
        backend: 'mock',
        workingDirectory: rootDir,
      });
      const adapter = createAITaskExecutorAdapter({
        instanceId: 'local-agent-adapter',
        backend: 'local-agent',
        localAgentRunner: runner,
        workingDirectory: rootDir,
      });

      const result = adapter.execute(createAITask());

      assert.equal(result.success, true);
      assert.equal(result.executorName, 'local-agent');
      assert.deepEqual(result.filesChanged, ['services/automation/local-task-1.ts']);
      assert.match(result.report.summary ?? '', /Mock executed Local Agent Task/);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('builds execution packages from AI task executor tasks', () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), 'local-agent-package-'));

    try {
      const pkg = fromAITaskExecutorTaskToPackage(createAITask(), rootDir);

      assert.equal(pkg.taskId, 'local-task-1');
      assert.match(pkg.prompt, /# Goal/);
      assert.equal(pkg.workingDirectory, rootDir);
      assert.deepEqual(pkg.allowedPaths, ['services/automation/local-task-1.ts']);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('creates a local-agent backend wrapper', () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), 'local-agent-backend-'));

    try {
      const backend = createLocalAgentBackend({
        runnerOptions: { backend: 'mock', workingDirectory: rootDir },
        workingDirectory: rootDir,
      });
      const result = backend.execute(createAITask());

      assert.equal(result.success, true);
      assert.deepEqual(result.filesChanged, ['services/automation/local-task-1.ts']);
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
