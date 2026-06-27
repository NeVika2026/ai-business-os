import type { ISODateTime } from '@/types/runtime/dto';

export type CursorTaskStatus = 'idle' | 'prepared' | 'completed' | 'failed';

export type CursorTaskMetadataValue = string | number | boolean | null;

export interface CursorTaskInput {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  allowedPaths: string[];
  forbiddenPaths: string[];
  requiredChecks: string[];
  outputFormat: string;
  files: string[];
  metadata: Record<string, CursorTaskMetadataValue>;
}

export interface CursorExecutionPackage {
  taskId: string;
  title: string;
  prompt: string;
  allowedPaths: string[];
  forbiddenPaths: string[];
  requiredChecks: string[];
  outputFormat: string;
  acceptanceCriteria: string[];
  status: 'prepared';
  preparedAt: ISODateTime;
}

export interface CursorTaskPrepareResult {
  taskId: string;
  prompt: string;
  package: CursorExecutionPackage;
}

export interface CursorTaskExecutionResult {
  success: boolean;
  status: 'prepared';
  durationMs: number;
  prompt: string;
  package: CursorExecutionPackage;
  summary: string;
}

export interface CursorTaskAdapterReportEntry {
  taskId: string;
  title: string;
  status: CursorTaskStatus;
  prompt: string;
  summary: string;
  preparedAt: ISODateTime;
}

export interface CursorTaskAdapterReport {
  instanceId: string;
  preparedCount: number;
  lastTaskId: string | null;
  entries: CursorTaskAdapterReportEntry[];
}

export interface CursorTaskAdapterSnapshot {
  instanceId: string;
  preparedCount: number;
  lastTaskId: string | null;
  lastPrompt: string | null;
  updatedAt: ISODateTime;
}

export interface CursorTaskAdapterOptions {
  instanceId?: string;
  defaultAllowedPaths?: string[];
  defaultForbiddenPaths?: string[];
  defaultRequiredChecks?: string[];
  defaultOutputFormat?: string;
}

export interface SerializedCursorExecutionPackage {
  taskId: string;
  title: string;
  prompt: string;
  allowedPaths: string[];
  forbiddenPaths: string[];
  requiredChecks: string[];
  outputFormat: string;
  acceptanceCriteria: string[];
  status: 'prepared';
  preparedAt: ISODateTime;
}

export interface SerializedCursorTaskExecutionResult {
  success: boolean;
  status: 'prepared';
  durationMs: number;
  prompt: string;
  package: SerializedCursorExecutionPackage;
  summary: string;
}

export interface SerializedCursorTaskAdapterReportEntry {
  taskId: string;
  title: string;
  status: CursorTaskStatus;
  prompt: string;
  summary: string;
  preparedAt: ISODateTime;
}

export interface SerializedCursorTaskAdapterReport {
  instanceId: string;
  preparedCount: number;
  lastTaskId: string | null;
  entries: SerializedCursorTaskAdapterReportEntry[];
}

export interface SerializedCursorTaskAdapterSnapshot {
  instanceId: string;
  preparedCount: number;
  lastTaskId: string | null;
  lastPrompt: string | null;
  updatedAt: ISODateTime;
  lastResult: SerializedCursorTaskExecutionResult | null;
  report: SerializedCursorTaskAdapterReport;
}
