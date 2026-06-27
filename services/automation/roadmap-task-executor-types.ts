import type { ISODateTime } from '@/types/runtime/dto';
import type { AITaskExecutorAdapter } from '@/services/automation/ai-task-executor-adapter';

export type RoadmapTaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export type RoadmapTaskMetadataValue = string | number | boolean | null;

export interface RoadmapTaskInput {
  id: string;
  title: string;
  description: string | null;
  dependencies: string[];
  status: RoadmapTaskStatus;
  metadata: Record<string, RoadmapTaskMetadataValue>;
}

export interface RoadmapTaskExecutionReport {
  taskId: string;
  title: string;
  status: 'completed' | 'failed' | 'prepared';
  startedAt: ISODateTime;
  finishedAt: ISODateTime;
  durationMs: number;
  filesChanged: string[];
  warnings: string[];
  errors: string[];
}

export interface RoadmapTaskHandlerResult {
  success: boolean;
  status?: 'completed' | 'failed' | 'prepared';
  filesChanged: string[];
  filesCreated?: string[];
  filesModified?: string[];
  filesDeleted?: string[];
  warnings: string[];
  errors: string[];
  rollbackAvailable?: boolean;
}

export interface RoadmapTaskExecutionHandler {
  execute(task: RoadmapTaskInput): RoadmapTaskHandlerResult;
}

export interface RoadmapTaskExecutorResult {
  success: boolean;
  durationMs: number;
  filesChanged: string[];
  warnings: string[];
  errors: string[];
  report: RoadmapTaskExecutionReport;
}

export interface RoadmapTaskExecutorReport {
  instanceId: string;
  registeredTaskCount: number;
  executedTaskCount: number;
  completedTaskCount: number;
  failedTaskCount: number;
  reports: RoadmapTaskExecutionReport[];
}

export interface RoadmapTaskExecutorSnapshot {
  instanceId: string;
  registeredTaskCount: number;
  executedTaskCount: number;
  completedTaskCount: number;
  failedTaskCount: number;
  lastTaskId: string | null;
  lastSuccess: boolean | null;
  updatedAt: ISODateTime;
}

export interface RoadmapTaskExecutorOptions {
  instanceId?: string;
  tasks?: RoadmapTaskInput[];
  handler?: RoadmapTaskExecutionHandler;
  adapter?: AITaskExecutorAdapter;
  rootDir?: string;
}

export interface SerializedRoadmapTaskExecutionReport {
  taskId: string;
  title: string;
  status: 'completed' | 'failed' | 'prepared';
  startedAt: ISODateTime;
  finishedAt: ISODateTime;
  durationMs: number;
  filesChanged: string[];
  warnings: string[];
  errors: string[];
}

export interface SerializedRoadmapTaskExecutorResult {
  success: boolean;
  durationMs: number;
  filesChanged: string[];
  warnings: string[];
  errors: string[];
  report: SerializedRoadmapTaskExecutionReport;
}

export interface SerializedRoadmapTaskExecutorReport {
  instanceId: string;
  registeredTaskCount: number;
  executedTaskCount: number;
  completedTaskCount: number;
  failedTaskCount: number;
  reports: SerializedRoadmapTaskExecutionReport[];
}

export interface SerializedRoadmapTaskExecutorSnapshot {
  instanceId: string;
  registeredTaskCount: number;
  executedTaskCount: number;
  completedTaskCount: number;
  failedTaskCount: number;
  lastTaskId: string | null;
  lastSuccess: boolean | null;
  updatedAt: ISODateTime;
  lastResult: SerializedRoadmapTaskExecutorResult | null;
  report: SerializedRoadmapTaskExecutorReport;
}
