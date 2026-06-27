import type { ISODateTime } from '@/types/runtime/dto';

export type RealTaskMetadataValue = string | number | boolean | null;

export type RealTaskOperationType =
  | 'createFile'
  | 'updateFile'
  | 'deleteFile'
  | 'createDirectory'
  | 'moveFile'
  | 'copyFile'
  | 'appendFile'
  | 'replaceText';

export interface RealTaskOperation {
  id: string;
  type: RealTaskOperationType;
  path: string;
  targetPath?: string | null;
  content?: string | null;
  search?: string | null;
  replacement?: string | null;
}

export interface RealTaskHandlerTask {
  id: string;
  title: string;
  description: string | null;
  operations: RealTaskOperation[];
  metadata: Record<string, RealTaskMetadataValue>;
}

export interface RealTaskPlan {
  taskId: string;
  taskTitle: string;
  operations: RealTaskOperation[];
}

export interface RealTaskExecutionResult {
  success: boolean;
  durationMs: number;
  filesCreated: string[];
  filesModified: string[];
  filesDeleted: string[];
  warnings: string[];
  errors: string[];
  rollbackAvailable: boolean;
}

export type RealTaskRollbackStatus = 'none' | 'available' | 'completed' | 'failed';

export interface RealTaskExecutionReportEntry {
  taskId: string;
  taskTitle: string;
  operations: RealTaskOperation[];
  durationMs: number;
  filesChanged: string[];
  filesCreated: string[];
  filesModified: string[];
  filesDeleted: string[];
  warnings: string[];
  errors: string[];
  rollbackStatus: RealTaskRollbackStatus;
  startedAt: ISODateTime;
  finishedAt: ISODateTime;
}

export interface RealTaskHandlerReport {
  instanceId: string;
  executionCount: number;
  reports: RealTaskExecutionReportEntry[];
}

export interface RealTaskHandlerSnapshot {
  instanceId: string;
  rootDir: string;
  executionCount: number;
  lastTaskId: string | null;
  lastSuccess: boolean | null;
  updatedAt: ISODateTime;
}

export interface RealTaskFileSystem {
  exists(path: string): boolean;
  isDirectory(path: string): boolean;
  isFile(path: string): boolean;
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
  appendFile(path: string, content: string): void;
  deleteFile(path: string): void;
  createDirectory(path: string): void;
  moveFile(from: string, to: string): void;
  copyFile(from: string, to: string): void;
  removeDirectory(path: string): void;
}

export interface RealTaskHandlerOptions {
  instanceId?: string;
  rootDir?: string;
  fs?: RealTaskFileSystem;
}

export interface SerializedRealTaskOperation {
  id: string;
  type: RealTaskOperationType;
  path: string;
  targetPath: string | null;
  content: string | null;
  search: string | null;
  replacement: string | null;
}

export interface SerializedRealTaskExecutionReportEntry {
  taskId: string;
  taskTitle: string;
  operations: SerializedRealTaskOperation[];
  durationMs: number;
  filesChanged: string[];
  filesCreated: string[];
  filesModified: string[];
  filesDeleted: string[];
  warnings: string[];
  errors: string[];
  rollbackStatus: RealTaskRollbackStatus;
  startedAt: ISODateTime;
  finishedAt: ISODateTime;
}

export interface SerializedRealTaskExecutionResult {
  success: boolean;
  durationMs: number;
  filesCreated: string[];
  filesModified: string[];
  filesDeleted: string[];
  warnings: string[];
  errors: string[];
  rollbackAvailable: boolean;
}

export interface SerializedRealTaskHandlerReport {
  instanceId: string;
  executionCount: number;
  reports: SerializedRealTaskExecutionReportEntry[];
}

export interface SerializedRealTaskHandlerSnapshot {
  instanceId: string;
  rootDir: string;
  executionCount: number;
  lastTaskId: string | null;
  lastSuccess: boolean | null;
  updatedAt: ISODateTime;
  lastResult: SerializedRealTaskExecutionResult | null;
  report: SerializedRealTaskHandlerReport;
}
