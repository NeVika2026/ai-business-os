import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
  appendFileSync,
} from 'node:fs';
import path from 'node:path';

import {
  RealTaskHandlerRollbackError,
  RealTaskHandlerValidationError,
} from '@/services/automation/real-task-handler-errors';
import { serializeRealTaskHandlerSnapshot } from '@/services/automation/real-task-handler-serializer';
import type {
  RealTaskExecutionReportEntry,
  RealTaskExecutionResult,
  RealTaskFileSystem,
  RealTaskHandlerOptions,
  RealTaskHandlerReport,
  RealTaskHandlerSnapshot,
  RealTaskHandlerTask,
  RealTaskOperation,
  RealTaskPlan,
  RealTaskRollbackStatus,
  SerializedRealTaskHandlerSnapshot,
} from '@/services/automation/real-task-handler-types';
import type {
  RoadmapTaskExecutionHandler,
  RoadmapTaskHandlerResult,
  RoadmapTaskInput,
} from '@/services/automation/roadmap-task-executor-types';

const SUPPORTED_OPERATION_TYPES = new Set<RealTaskOperation['type']>([
  'createFile',
  'updateFile',
  'deleteFile',
  'createDirectory',
  'moveFile',
  'copyFile',
  'appendFile',
  'replaceText',
]);

interface RollbackRecord {
  path: string;
  kind: 'created-file' | 'created-directory' | 'modified' | 'deleted' | 'moved' | 'copied';
  previousContent: string | null;
  previousExisted: boolean;
  movedFrom: string | null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createNodeFileSystem(rootDir: string): RealTaskFileSystem {
  const resolvedRoot = path.resolve(rootDir);

  const resolvePath = (inputPath: string): string => {
    if (!isNonEmptyString(inputPath)) {
      throw new RealTaskHandlerValidationError('path is required');
    }

    const resolved = path.resolve(resolvedRoot, inputPath);
    const relative = path.relative(resolvedRoot, resolved);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new RealTaskHandlerValidationError(`path traversal detected: ${inputPath}`);
    }

    return resolved;
  };

  return {
    exists(inputPath) {
      return existsSync(resolvePath(inputPath));
    },
    isDirectory(inputPath) {
      const resolved = resolvePath(inputPath);
      return existsSync(resolved) && statSync(resolved).isDirectory();
    },
    isFile(inputPath) {
      const resolved = resolvePath(inputPath);
      return existsSync(resolved) && statSync(resolved).isFile();
    },
    readFile(inputPath) {
      return readFileSync(resolvePath(inputPath), 'utf8');
    },
    writeFile(inputPath, content) {
      const resolved = resolvePath(inputPath);
      mkdirSync(path.dirname(resolved), { recursive: true });
      writeFileSync(resolved, content, 'utf8');
    },
    appendFile(inputPath, content) {
      appendFileSync(resolvePath(inputPath), content, 'utf8');
    },
    deleteFile(inputPath) {
      unlinkSync(resolvePath(inputPath));
    },
    createDirectory(inputPath) {
      mkdirSync(resolvePath(inputPath), { recursive: true });
    },
    moveFile(fromPath, toPath) {
      const from = resolvePath(fromPath);
      const to = resolvePath(toPath);
      mkdirSync(path.dirname(to), { recursive: true });
      renameSync(from, to);
    },
    copyFile(fromPath, toPath) {
      const from = resolvePath(fromPath);
      const to = resolvePath(toPath);
      mkdirSync(path.dirname(to), { recursive: true });
      copyFileSync(from, to);
    },
    removeDirectory(inputPath) {
      rmdirSync(resolvePath(inputPath));
    },
  };
}

function parseOperationsFromMetadata(
  metadata: Record<string, string | number | boolean | null>,
): RealTaskOperation[] {
  const raw = metadata.operations;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map((entry, index) => ({
      id: isNonEmptyString(entry.id) ? String(entry.id).trim() : `operation-${index + 1}`,
      type: String(entry.type ?? '').trim() as RealTaskOperation['type'],
      path: String(entry.path ?? '').trim(),
      targetPath: isNonEmptyString(entry.targetPath) ? String(entry.targetPath).trim() : null,
      content: typeof entry.content === 'string' ? entry.content : null,
      search: typeof entry.search === 'string' ? entry.search : null,
      replacement: typeof entry.replacement === 'string' ? entry.replacement : null,
    }));
}

function createDefaultOperations(task: RealTaskHandlerTask): RealTaskOperation[] {
  const content = [
    `// ${task.title}`,
    task.description ? `// ${task.description}` : null,
    '',
    `export const taskId = '${task.id}';`,
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');

  return [
    {
      id: `${task.id}-create-default`,
      type: 'createFile',
      path: `services/automation/${task.id}.ts`,
      content,
      targetPath: null,
      search: null,
      replacement: null,
    },
  ];
}

function fromRoadmapTask(task: RoadmapTaskInput): RealTaskHandlerTask {
  const operations = parseOperationsFromMetadata(task.metadata);

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    operations,
    metadata: { ...task.metadata },
  };
}

/**
 * Synchronous file-based task handler with planning, validation, rollback, and reporting.
 */
export class RealTaskHandler {
  private reports: RealTaskExecutionReportEntry[] = [];
  private lastResult: RealTaskExecutionResult | null = null;
  private lastRollbackRecords: RollbackRecord[] = [];
  private snapshot: RealTaskHandlerSnapshot;

  constructor(
    private readonly instanceId: string,
    private readonly rootDir: string,
    private readonly fs: RealTaskFileSystem,
  ) {
    this.snapshot = this.createEmptySnapshot();
  }

  plan(task: RealTaskHandlerTask): RealTaskPlan {
    this.assertTaskFields(task);

    const operations =
      task.operations.length > 0 ? [...task.operations] : createDefaultOperations(task);

    return {
      taskId: task.id.trim(),
      taskTitle: task.title.trim(),
      operations,
    };
  }

  validate(task: RealTaskHandlerTask): void {
    this.assertTaskFields(task);
    const planned = this.plan(task);
    this.validateOperations(planned.operations);
  }

  execute(task: RealTaskHandlerTask): RealTaskExecutionResult {
    const startedAt = nowIso();
    const startMs = Date.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      this.validate(task);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'task validation failed';
      const result = this.buildFailureResult(startMs, errors.concat(message), warnings, false);
      this.storeExecution(task, startedAt, nowIso(), this.plannedOperations(task), result, 'none');
      return result;
    }

    const planned = this.plan(task);
    const filesCreated: string[] = [];
    const filesModified: string[] = [];
    const filesDeleted: string[] = [];
    const rollbackRecords: RollbackRecord[] = [];

    try {
      for (const operation of planned.operations) {
        this.applyOperation(operation, rollbackRecords, filesCreated, filesModified, filesDeleted);
      }

      this.verifyOperations(planned.operations, errors);

      if (errors.length > 0) {
        this.performRollback(rollbackRecords);
        const result = this.buildFailureResult(startMs, errors, warnings, false);
        this.storeExecution(task, startedAt, nowIso(), planned.operations, result, 'completed');
        return result;
      }

      const result: RealTaskExecutionResult = {
        success: true,
        durationMs: Date.now() - startMs,
        filesCreated,
        filesModified,
        filesDeleted,
        warnings,
        errors,
        rollbackAvailable: false,
      };

      this.lastRollbackRecords = [];
      this.storeExecution(task, startedAt, nowIso(), planned.operations, result, 'none');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'task execution failed';
      errors.push(message);

      let rollbackStatus: RealTaskRollbackStatus = 'none';
      try {
        this.performRollback(rollbackRecords);
        rollbackStatus = 'completed';
      } catch (rollbackError) {
        rollbackStatus = 'failed';
        errors.push(rollbackError instanceof Error ? rollbackError.message : 'rollback failed');
      }

      const result = this.buildFailureResult(startMs, errors, warnings, rollbackRecords.length > 0);
      this.lastRollbackRecords = rollbackRecords;
      this.storeExecution(task, startedAt, nowIso(), planned.operations, result, rollbackStatus);
      return result;
    }
  }

  rollback(task: RealTaskHandlerTask): RealTaskRollbackStatus {
    if (this.lastRollbackRecords.length === 0) {
      return 'none';
    }

    try {
      this.performRollback(this.lastRollbackRecords);
      this.lastRollbackRecords = [];
      return 'completed';
    } catch (error) {
      throw new RealTaskHandlerRollbackError(
        error instanceof Error ? error.message : 'rollback failed',
      );
    } finally {
      void task;
    }
  }

  report(): RealTaskHandlerReport {
    return {
      instanceId: this.instanceId,
      executionCount: this.reports.length,
      reports: [...this.reports],
    };
  }

  serialize(): SerializedRealTaskHandlerSnapshot {
    return serializeRealTaskHandlerSnapshot({
      snapshot: this.snapshot,
      lastResult: this.lastResult,
      report: this.report(),
    });
  }

  reset(): void {
    this.reports = [];
    this.lastResult = null;
    this.lastRollbackRecords = [];
    this.snapshot = this.createEmptySnapshot();
  }

  toRoadmapHandler(): RoadmapTaskExecutionHandler {
    return {
      execute: (task) => this.executeRoadmapTask(task),
    };
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  getRootDir(): string {
    return this.rootDir;
  }

  private executeRoadmapTask(task: RoadmapTaskInput): RoadmapTaskHandlerResult {
    const result = this.execute(fromRoadmapTask(task));
    const filesChanged = [...result.filesCreated, ...result.filesModified, ...result.filesDeleted];

    return {
      success: result.success,
      filesChanged,
      filesCreated: result.filesCreated,
      filesModified: result.filesModified,
      filesDeleted: result.filesDeleted,
      warnings: result.warnings,
      errors: result.errors,
      rollbackAvailable: result.rollbackAvailable,
    };
  }

  private plannedOperations(task: RealTaskHandlerTask): RealTaskOperation[] {
    try {
      return this.plan(task).operations;
    } catch {
      return [];
    }
  }

  private assertTaskFields(task: RealTaskHandlerTask): void {
    if (!task || typeof task !== 'object') {
      throw new RealTaskHandlerValidationError('task must be an object');
    }

    if (!isNonEmptyString(task.id)) {
      throw new RealTaskHandlerValidationError('task id is required');
    }

    if (!isNonEmptyString(task.title)) {
      throw new RealTaskHandlerValidationError('task title is required');
    }
  }

  private validateOperations(operations: RealTaskOperation[]): void {
    if (operations.length === 0) {
      throw new RealTaskHandlerValidationError('at least one operation is required');
    }

    const seenIds = new Set<string>();

    for (const operation of operations) {
      if (!isNonEmptyString(operation.id)) {
        throw new RealTaskHandlerValidationError('operation id is required');
      }

      if (seenIds.has(operation.id)) {
        throw new RealTaskHandlerValidationError(`duplicate operation id: ${operation.id}`);
      }

      seenIds.add(operation.id);

      if (!SUPPORTED_OPERATION_TYPES.has(operation.type)) {
        throw new RealTaskHandlerValidationError(`unsupported operation type: ${operation.type}`);
      }

      if (!isNonEmptyString(operation.path)) {
        throw new RealTaskHandlerValidationError(`invalid path for operation ${operation.id}`);
      }

      this.resolvePath(operation.path);

      switch (operation.type) {
        case 'createFile':
          if (operation.content === null || operation.content === undefined) {
            throw new RealTaskHandlerValidationError(
              `content is required for createFile: ${operation.id}`,
            );
          }

          if (this.fs.exists(operation.path)) {
            throw new RealTaskHandlerValidationError(
              `file already exists for createFile: ${operation.path}`,
            );
          }
          break;

        case 'updateFile':
          if (operation.content === null || operation.content === undefined) {
            throw new RealTaskHandlerValidationError(
              `content is required for updateFile: ${operation.id}`,
            );
          }

          if (!this.fs.exists(operation.path) || !this.fs.isFile(operation.path)) {
            throw new RealTaskHandlerValidationError(
              `missing target file for updateFile: ${operation.path}`,
            );
          }
          break;

        case 'deleteFile':
          if (!this.fs.exists(operation.path) || !this.fs.isFile(operation.path)) {
            throw new RealTaskHandlerValidationError(
              `missing target file for deleteFile: ${operation.path}`,
            );
          }
          break;

        case 'createDirectory':
          if (this.fs.exists(operation.path)) {
            throw new RealTaskHandlerValidationError(
              `directory already exists for createDirectory: ${operation.path}`,
            );
          }
          break;

        case 'moveFile':
        case 'copyFile':
          if (!isNonEmptyString(operation.targetPath ?? undefined)) {
            throw new RealTaskHandlerValidationError(
              `targetPath is required for ${operation.type}: ${operation.id}`,
            );
          }

          this.resolvePath(operation.targetPath as string);

          if (!this.fs.exists(operation.path)) {
            throw new RealTaskHandlerValidationError(
              `missing source for ${operation.type}: ${operation.path}`,
            );
          }

          if (this.fs.exists(operation.targetPath as string)) {
            throw new RealTaskHandlerValidationError(
              `target already exists for ${operation.type}: ${operation.targetPath}`,
            );
          }
          break;

        case 'appendFile':
          if (operation.content === null || operation.content === undefined) {
            throw new RealTaskHandlerValidationError(
              `content is required for appendFile: ${operation.id}`,
            );
          }

          if (!this.fs.exists(operation.path) || !this.fs.isFile(operation.path)) {
            throw new RealTaskHandlerValidationError(
              `missing target file for appendFile: ${operation.path}`,
            );
          }
          break;

        case 'replaceText':
          if (!isNonEmptyString(operation.search ?? undefined)) {
            throw new RealTaskHandlerValidationError(
              `search is required for replaceText: ${operation.id}`,
            );
          }

          if (operation.replacement === null || operation.replacement === undefined) {
            throw new RealTaskHandlerValidationError(
              `replacement is required for replaceText: ${operation.id}`,
            );
          }

          if (!this.fs.exists(operation.path) || !this.fs.isFile(operation.path)) {
            throw new RealTaskHandlerValidationError(
              `missing target file for replaceText: ${operation.path}`,
            );
          }

          if (!this.fs.readFile(operation.path).includes(operation.search as string)) {
            throw new RealTaskHandlerValidationError(
              `invalid replacement search text for replaceText: ${operation.id}`,
            );
          }
          break;
      }
    }
  }

  private resolvePath(inputPath: string): string {
    if (!isNonEmptyString(inputPath)) {
      throw new RealTaskHandlerValidationError('path is required');
    }

    const resolved = path.resolve(this.rootDir, inputPath);
    const relative = path.relative(path.resolve(this.rootDir), resolved);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new RealTaskHandlerValidationError(`path traversal detected: ${inputPath}`);
    }

    return resolved;
  }

  private applyOperation(
    operation: RealTaskOperation,
    rollbackRecords: RollbackRecord[],
    filesCreated: string[],
    filesModified: string[],
    filesDeleted: string[],
  ): void {
    switch (operation.type) {
      case 'createFile': {
        rollbackRecords.push({
          path: operation.path,
          kind: 'created-file',
          previousContent: null,
          previousExisted: false,
          movedFrom: null,
        });
        this.fs.writeFile(operation.path, operation.content ?? '');
        filesCreated.push(operation.path);
        return;
      }

      case 'updateFile': {
        const previousContent = this.fs.readFile(operation.path);
        rollbackRecords.push({
          path: operation.path,
          kind: 'modified',
          previousContent,
          previousExisted: true,
          movedFrom: null,
        });
        this.fs.writeFile(operation.path, operation.content ?? '');
        filesModified.push(operation.path);
        return;
      }

      case 'deleteFile': {
        const previousContent = this.fs.readFile(operation.path);
        rollbackRecords.push({
          path: operation.path,
          kind: 'deleted',
          previousContent,
          previousExisted: true,
          movedFrom: null,
        });
        this.fs.deleteFile(operation.path);
        filesDeleted.push(operation.path);
        return;
      }

      case 'createDirectory': {
        rollbackRecords.push({
          path: operation.path,
          kind: 'created-directory',
          previousContent: null,
          previousExisted: false,
          movedFrom: null,
        });
        this.fs.createDirectory(operation.path);
        filesCreated.push(operation.path);
        return;
      }

      case 'moveFile': {
        const previousContent = this.fs.isFile(operation.path)
          ? this.fs.readFile(operation.path)
          : null;
        rollbackRecords.push({
          path: operation.targetPath as string,
          kind: 'moved',
          previousContent,
          previousExisted: this.fs.exists(operation.targetPath as string),
          movedFrom: operation.path,
        });
        this.fs.moveFile(operation.path, operation.targetPath as string);
        filesDeleted.push(operation.path);
        filesCreated.push(operation.targetPath as string);
        return;
      }

      case 'copyFile': {
        rollbackRecords.push({
          path: operation.targetPath as string,
          kind: 'copied',
          previousContent: null,
          previousExisted: false,
          movedFrom: null,
        });
        this.fs.copyFile(operation.path, operation.targetPath as string);
        filesCreated.push(operation.targetPath as string);
        return;
      }

      case 'appendFile': {
        const previousContent = this.fs.readFile(operation.path);
        rollbackRecords.push({
          path: operation.path,
          kind: 'modified',
          previousContent,
          previousExisted: true,
          movedFrom: null,
        });
        this.fs.appendFile(operation.path, operation.content ?? '');
        filesModified.push(operation.path);
        return;
      }

      case 'replaceText': {
        const previousContent = this.fs.readFile(operation.path);
        const nextContent = previousContent.replaceAll(
          operation.search as string,
          operation.replacement ?? '',
        );
        rollbackRecords.push({
          path: operation.path,
          kind: 'modified',
          previousContent,
          previousExisted: true,
          movedFrom: null,
        });
        this.fs.writeFile(operation.path, nextContent);
        filesModified.push(operation.path);
      }
    }
  }

  private verifyOperations(operations: RealTaskOperation[], errors: string[]): void {
    for (const operation of operations) {
      switch (operation.type) {
        case 'createFile':
        case 'copyFile':
          if (operation.type === 'copyFile') {
            if (!this.fs.exists(operation.targetPath as string)) {
              errors.push(`verification failed: missing copied file ${operation.targetPath}`);
            }
            break;
          }

          if (!this.fs.exists(operation.path) || !this.fs.isFile(operation.path)) {
            errors.push(`verification failed: missing created file ${operation.path}`);
          }
          break;

        case 'updateFile':
        case 'appendFile':
        case 'replaceText':
          if (!this.fs.exists(operation.path) || !this.fs.isFile(operation.path)) {
            errors.push(`verification failed: missing modified file ${operation.path}`);
          }
          break;

        case 'deleteFile':
          if (this.fs.exists(operation.path)) {
            errors.push(`verification failed: file was not deleted ${operation.path}`);
          }
          break;

        case 'createDirectory':
          if (!this.fs.exists(operation.path) || !this.fs.isDirectory(operation.path)) {
            errors.push(`verification failed: missing created directory ${operation.path}`);
          }
          break;

        case 'moveFile':
          if (this.fs.exists(operation.path)) {
            errors.push(`verification failed: source was not moved ${operation.path}`);
          }

          if (!this.fs.exists(operation.targetPath as string)) {
            errors.push(`verification failed: move target missing ${operation.targetPath}`);
          }
          break;
      }
    }
  }

  private performRollback(records: RollbackRecord[]): void {
    for (const record of [...records].reverse()) {
      switch (record.kind) {
        case 'created-file':
          if (this.fs.exists(record.path) && this.fs.isFile(record.path)) {
            this.fs.deleteFile(record.path);
          }
          break;

        case 'created-directory':
          if (this.fs.exists(record.path) && this.fs.isDirectory(record.path)) {
            this.fs.removeDirectory(record.path);
          }
          break;

        case 'modified':
        case 'deleted':
          if (record.previousExisted) {
            this.fs.writeFile(record.path, record.previousContent ?? '');
          } else if (this.fs.exists(record.path)) {
            this.fs.deleteFile(record.path);
          }
          break;

        case 'copied':
          if (this.fs.exists(record.path)) {
            if (this.fs.isFile(record.path)) {
              this.fs.deleteFile(record.path);
            } else if (this.fs.isDirectory(record.path)) {
              this.fs.removeDirectory(record.path);
            }
          }
          break;

        case 'moved':
          if (record.movedFrom && this.fs.exists(record.path)) {
            this.fs.moveFile(record.path, record.movedFrom);
          }
          break;
      }
    }
  }

  private buildFailureResult(
    startMs: number,
    errors: string[],
    warnings: string[],
    rollbackAvailable: boolean,
  ): RealTaskExecutionResult {
    return {
      success: false,
      durationMs: Date.now() - startMs,
      filesCreated: [],
      filesModified: [],
      filesDeleted: [],
      warnings,
      errors,
      rollbackAvailable,
    };
  }

  private storeExecution(
    task: RealTaskHandlerTask,
    startedAt: string,
    finishedAt: string,
    operations: RealTaskOperation[],
    result: RealTaskExecutionResult,
    rollbackStatus: RealTaskRollbackStatus,
  ): void {
    const filesChanged = [...result.filesCreated, ...result.filesModified, ...result.filesDeleted];

    const reportEntry: RealTaskExecutionReportEntry = {
      taskId: task.id,
      taskTitle: task.title,
      operations: operations.map((operation) => ({ ...operation })),
      durationMs: result.durationMs,
      filesChanged,
      filesCreated: [...result.filesCreated],
      filesModified: [...result.filesModified],
      filesDeleted: [...result.filesDeleted],
      warnings: [...result.warnings],
      errors: [...result.errors],
      rollbackStatus,
      startedAt,
      finishedAt,
    };

    this.reports.push(reportEntry);
    this.lastResult = result;
    this.snapshot = {
      instanceId: this.instanceId,
      rootDir: this.rootDir,
      executionCount: this.reports.length,
      lastTaskId: task.id,
      lastSuccess: result.success,
      updatedAt: nowIso(),
    };
  }

  private createEmptySnapshot(): RealTaskHandlerSnapshot {
    return {
      instanceId: this.instanceId,
      rootDir: this.rootDir,
      executionCount: 0,
      lastTaskId: null,
      lastSuccess: null,
      updatedAt: nowIso(),
    };
  }
}

export function createRealTaskHandler(options?: RealTaskHandlerOptions): RealTaskHandler {
  const instanceId = options?.instanceId?.trim() || 'default-real-task-handler';
  const rootDir = path.resolve(options?.rootDir ?? process.cwd());
  const fs = options?.fs ?? createNodeFileSystem(rootDir);

  return new RealTaskHandler(instanceId, rootDir, fs);
}

/** Default dev/test singleton. Synchronous file-based task handler. */
export const realTaskHandler = createRealTaskHandler();
