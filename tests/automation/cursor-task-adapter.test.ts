import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createAITaskExecutorAdapter } from '@/services/automation/ai-task-executor-adapter';
import {
  createCursorTaskAdapter,
  fromAITaskExecutorTask,
} from '@/services/automation/cursor-task-adapter';
import { CursorTaskAdapterValidationError } from '@/services/automation/cursor-task-adapter-errors';
import type { AITaskExecutorTask } from '@/services/automation/ai-task-executor-adapter-types';
import type { CursorTaskInput } from '@/services/automation/cursor-task-adapter-types';

function createAITask(overrides?: Partial<AITaskExecutorTask>): AITaskExecutorTask {
  return {
    id: 'cursor-task-1',
    title: 'Cursor Task Adapter',
    description: 'Prepare a roadmap task for Cursor Agent execution.',
    acceptanceCriteria: ['Prompt includes all required sections'],
    files: ['services/automation/example.ts'],
    dependencies: [],
    status: 'idle',
    metadata: {},
    ...overrides,
  };
}

function createCursorTask(overrides?: Partial<CursorTaskInput>): CursorTaskInput {
  return {
    id: 'cursor-task-1',
    title: 'Cursor Task Adapter',
    description: 'Prepare a roadmap task for Cursor Agent execution.',
    acceptanceCriteria: ['Prompt includes all required sections'],
    allowedPaths: ['services/automation/example.ts'],
    forbiddenPaths: ['services/runtime/'],
    requiredChecks: ['npm run lint', 'npm run build'],
    outputFormat: 'Return only:\nCreated:\nModified:',
    files: ['services/automation/example.ts'],
    metadata: {},
    ...overrides,
  };
}

describe('CursorTaskAdapter', () => {
  it('prepares a Cursor-ready prompt with required sections', () => {
    const adapter = createCursorTaskAdapter({ instanceId: 'cursor-adapter-prompt' });
    const prompt = adapter.prompt(createCursorTask());

    assert.match(prompt, /^# Goal/m);
    assert.match(prompt, /## Allowed files/m);
    assert.match(prompt, /## Forbidden files/m);
    assert.match(prompt, /## Steps/m);
    assert.match(prompt, /## Validation/m);
    assert.match(prompt, /## Return format/m);
    assert.match(prompt, /Do not commit\./m);
    assert.match(prompt, /Do not push\./m);
    assert.match(prompt, /Cursor Task Adapter/m);
    assert.match(prompt, /Prompt includes all required sections/m);
  });

  it('generates an execution package with prepared status', () => {
    const adapter = createCursorTaskAdapter({ instanceId: 'cursor-adapter-package' });
    const pkg = adapter.package(createCursorTask());

    assert.equal(pkg.taskId, 'cursor-task-1');
    assert.equal(pkg.status, 'prepared');
    assert.equal(pkg.title, 'Cursor Task Adapter');
    assert.deepEqual(pkg.allowedPaths, ['services/automation/example.ts']);
    assert.deepEqual(pkg.forbiddenPaths, ['services/runtime/']);
    assert.deepEqual(pkg.requiredChecks, ['npm run lint', 'npm run build']);
    assert.match(pkg.prompt, /# Goal/);
    assert.ok(pkg.preparedAt);
  });

  it('execute returns prepared package without changing files', () => {
    const adapter = createCursorTaskAdapter({ instanceId: 'cursor-adapter-execute' });
    const result = adapter.execute(createCursorTask());

    assert.equal(result.success, true);
    assert.equal(result.status, 'prepared');
    assert.match(result.prompt, /# Goal/);
    assert.equal(result.package.status, 'prepared');
    assert.match(result.summary, /taskId=cursor-task-1/);
    assert.equal(adapter.report().preparedCount, 1);
  });

  it('rejects invalid task input during validation', () => {
    const adapter = createCursorTaskAdapter({ instanceId: 'cursor-adapter-validate' });

    assert.throws(
      () => adapter.validate(createCursorTask({ title: '   ' })),
      (error: unknown) => error instanceof CursorTaskAdapterValidationError,
    );

    assert.throws(
      () => adapter.validate(createCursorTask({ description: '   ' })),
      (error: unknown) => error instanceof CursorTaskAdapterValidationError,
    );
  });

  it('serializes adapter state with null instead of undefined', () => {
    const adapter = createCursorTaskAdapter({ instanceId: 'cursor-adapter-serialize' });
    adapter.execute(createCursorTask());

    const snapshot = adapter.serialize();

    assert.equal(snapshot.instanceId, 'cursor-adapter-serialize');
    assert.equal(snapshot.preparedCount, 1);
    assert.equal(snapshot.lastTaskId, 'cursor-task-1');
    assert.ok(snapshot.lastPrompt);
    assert.ok(snapshot.lastResult);
    assert.equal(snapshot.lastResult?.status, 'prepared');
    assert.equal(snapshot.report.preparedCount, 1);
    assert.equal(snapshot.report.lastTaskId, 'cursor-task-1');

    adapter.reset();
    const resetSnapshot = adapter.serialize();
    assert.equal(resetSnapshot.preparedCount, 0);
    assert.equal(resetSnapshot.lastTaskId, null);
    assert.equal(resetSnapshot.lastPrompt, null);
    assert.equal(resetSnapshot.lastResult, null);
  });

  it('maps AI task executor tasks into Cursor task input', () => {
    const cursorTask = fromAITaskExecutorTask(createAITask());

    assert.equal(cursorTask.id, 'cursor-task-1');
    assert.deepEqual(cursorTask.allowedPaths, ['services/automation/example.ts']);
    assert.deepEqual(cursorTask.acceptanceCriteria, ['Prompt includes all required sections']);
  });
});

describe('AITaskExecutorAdapter cursor backend', () => {
  it('uses CursorTaskAdapter when backend is cursor', () => {
    const adapter = createAITaskExecutorAdapter({
      instanceId: 'ai-adapter-cursor',
      backend: 'cursor',
    });

    const result = adapter.execute(createAITask());

    assert.equal(result.success, true);
    assert.equal(result.executorName, 'cursor');
    assert.equal(result.status, 'prepared');
    assert.equal(result.report.status, 'prepared');
    assert.deepEqual(result.filesChanged, []);
    assert.ok(result.prompt);
    assert.match(result.prompt ?? '', /# Goal/);
    assert.ok(result.packageSummary);
    assert.match(result.report.summary ?? '', /# Goal/);
    assert.match(result.report.summary ?? '', /Package summary:/);
  });
});
