import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import { assertSafeHandlerRootDir } from '@/services/automation/roadmap-task-executor';
import { RoadmapTaskExecutorValidationError } from '@/services/automation/roadmap-task-executor-errors';
import { RealTaskHandlerValidationError } from '@/services/automation/real-task-handler-errors';
import {
  createNodeFileSystem,
  createRealTaskHandler,
} from '@/services/automation/real-task-handler';
import type {
  RealTaskFileSystem,
  RealTaskHandlerTask,
  RealTaskOperation,
} from '@/services/automation/real-task-handler-types';

function createTempRoot(prefix: string): string {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

function cleanupTempRoot(rootDir: string): void {
  rmSync(rootDir, { recursive: true, force: true });
}

function createTask(
  operations: RealTaskOperation[],
  overrides?: Partial<RealTaskHandlerTask>,
): RealTaskHandlerTask {
  return {
    id: 'task-1',
    title: 'Task One',
    description: 'Example task',
    operations,
    metadata: {},
    ...overrides,
  };
}

describe('RealTaskHandler', () => {
  before(() => {
    process.env.AUTOMATION_TEST_ROOT_REQUIRED = '1';
  });

  it('creates a file', () => {
    const rootDir = createTempRoot('real-task-handler-create-');

    try {
      const handler = createRealTaskHandler({ instanceId: 'real-task-create', rootDir });
      const task = createTask([
        {
          id: 'op-create',
          type: 'createFile',
          path: 'notes/hello.txt',
          content: 'hello world',
        },
      ]);

      const result = handler.execute(task);

      assert.equal(result.success, true);
      assert.deepEqual(result.filesCreated, ['notes/hello.txt']);
      assert.equal(createNodeFileSystem(rootDir).readFile('notes/hello.txt'), 'hello world');
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('modifies a file', () => {
    const rootDir = createTempRoot('real-task-handler-modify-');

    try {
      const fs = createNodeFileSystem(rootDir);
      fs.writeFile('notes/source.txt', 'before');

      const handler = createRealTaskHandler({ instanceId: 'real-task-modify', rootDir, fs });
      const result = handler.execute(
        createTask([
          {
            id: 'op-update',
            type: 'updateFile',
            path: 'notes/source.txt',
            content: 'after',
          },
        ]),
      );

      assert.equal(result.success, true);
      assert.deepEqual(result.filesModified, ['notes/source.txt']);
      assert.equal(fs.readFile('notes/source.txt'), 'after');
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('deletes a file', () => {
    const rootDir = createTempRoot('real-task-handler-delete-');

    try {
      const fs = createNodeFileSystem(rootDir);
      fs.writeFile('notes/remove.txt', 'delete me');

      const handler = createRealTaskHandler({ instanceId: 'real-task-delete', rootDir, fs });
      const result = handler.execute(
        createTask([
          {
            id: 'op-delete',
            type: 'deleteFile',
            path: 'notes/remove.txt',
          },
        ]),
      );

      assert.equal(result.success, true);
      assert.deepEqual(result.filesDeleted, ['notes/remove.txt']);
      assert.equal(fs.exists('notes/remove.txt'), false);
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('rolls back changes when execution fails', () => {
    const rootDir = createTempRoot('real-task-handler-rollback-');

    try {
      const baseFs = createNodeFileSystem(rootDir);
      const fs: RealTaskFileSystem = {
        ...baseFs,
        writeFile(filePath, content) {
          if (filePath.includes('fail.txt')) {
            throw new Error('simulated write failure');
          }

          baseFs.writeFile(filePath, content);
        },
      };

      const handler = createRealTaskHandler({
        instanceId: 'real-task-rollback',
        rootDir,
        fs,
      });

      const task = createTask([
        {
          id: 'op-good',
          type: 'createFile',
          path: 'notes/good.txt',
          content: 'keep nothing',
        },
        {
          id: 'op-fail',
          type: 'createFile',
          path: 'notes/fail.txt',
          content: 'boom',
        },
      ]);

      const result = handler.execute(task);

      assert.equal(result.success, false);
      assert.match(result.errors.join('\n'), /simulated write failure/);
      assert.equal(baseFs.exists('notes/good.txt'), false);
      assert.equal(handler.report().reports[0]?.rollbackStatus, 'completed');
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('serializes handler state after execution', () => {
    const rootDir = createTempRoot('real-task-handler-serialize-');

    try {
      const handler = createRealTaskHandler({ instanceId: 'real-task-serialize', rootDir });
      const task = createTask([
        {
          id: 'op-create',
          type: 'createFile',
          path: 'notes/serialize.txt',
          content: 'serialized',
        },
      ]);

      handler.execute(task);
      const snapshot = handler.serialize();

      assert.equal(snapshot.instanceId, 'real-task-serialize');
      assert.equal(snapshot.executionCount, 1);
      assert.equal(snapshot.lastTaskId, 'task-1');
      assert.equal(snapshot.lastSuccess, true);
      assert.ok(snapshot.lastResult);
      assert.equal(snapshot.report.reports.length, 1);
      assert.equal(snapshot.report.reports[0]?.filesChanged[0], 'notes/serialize.txt');

      handler.reset();
      const resetSnapshot = handler.serialize();
      assert.equal(resetSnapshot.executionCount, 0);
      assert.equal(resetSnapshot.lastResult, null);
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('rejects invalid operations during validation', () => {
    const rootDir = createTempRoot('real-task-handler-validate-');

    try {
      const handler = createRealTaskHandler({ instanceId: 'real-task-validate', rootDir });

      assert.throws(
        () =>
          handler.validate(
            createTask([
              {
                id: 'op-create',
                type: 'createFile',
                path: '../outside.txt',
                content: 'blocked',
              },
            ]),
          ),
        (error: unknown) => error instanceof RealTaskHandlerValidationError,
      );

      assert.throws(
        () =>
          handler.validate(
            createTask([
              { id: 'dup', type: 'createFile', path: 'a.txt', content: 'a' },
              { id: 'dup', type: 'createFile', path: 'b.txt', content: 'b' },
            ]),
          ),
        (error: unknown) => error instanceof RealTaskHandlerValidationError,
      );
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('rejects services/automation as rootDir during tests', () => {
    const automationDir = path.resolve(process.cwd(), 'services/automation');

    assert.throws(
      () => assertSafeHandlerRootDir(automationDir),
      (error: unknown) => error instanceof RoadmapTaskExecutorValidationError,
    );
  });
});
