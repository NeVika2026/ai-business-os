import type { ISODateTime } from '@/types/runtime/dto';
import type { AutomationPlanner } from '@/services/automation/automation-planner';
import type { AITaskExecutorAdapter } from '@/services/automation/ai-task-executor-adapter';
import type { CommandRunner } from '@/services/automation/command-runner';
import type { RoadmapTaskExecutor } from '@/services/automation/roadmap-task-executor';
import type { RoadmapTaskExecutionHandler } from '@/services/automation/roadmap-task-executor-types';
import type { RoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-types';

export type AutonomousWorkerState =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'stopped';

export type AutonomousWorkerTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface AutonomousWorkerStartInput {
  roadmap: RoadmapInput;
}

export interface AutonomousWorkerTask {
  taskId: string;
  sprintId: string;
  code: string;
  title: string;
  description: string | null;
  status: AutonomousWorkerTaskStatus;
  dependsOn: string[];
  skipLint: boolean;
  skipBuild: boolean;
  includeTests: boolean;
  startedAt: ISODateTime | null;
  finishedAt: ISODateTime | null;
  durationMs: number | null;
}

export interface AutonomousWorkerExecutorResult {
  success: boolean;
  files: string[];
  errors: string[];
  warnings: string[];
  output: string | null;
  durationMs: number;
  status?: 'completed' | 'failed' | 'prepared';
}

export interface AutonomousWorkerCommandResult {
  success: boolean;
  command: string;
  args: string[];
  exitCode: number;
  stdout: string | null;
  stderr: string | null;
  errors: string[];
  warnings: string[];
  output: string | null;
  durationMs: number;
}

export interface AutonomousWorkerTaskReport {
  taskId: string;
  sprintId: string;
  code: string;
  title: string;
  status: 'completed' | 'failed' | 'prepared';
  durationMs: number;
  files: string[];
  errors: string[];
  warnings: string[];
  lint: AutonomousWorkerCommandResult | null;
  build: AutonomousWorkerCommandResult | null;
  tests: AutonomousWorkerCommandResult | null;
  executor: AutonomousWorkerExecutorResult;
}

export interface AutonomousWorkerNextTaskResult {
  executed: boolean;
  taskId: string | null;
  taskStatus: AutonomousWorkerTaskStatus | null;
  workerState: AutonomousWorkerState;
  stopped: boolean;
  reason: string | null;
  report: AutonomousWorkerTaskReport | null;
}

export interface AutonomousWorkerStatusView {
  state: AutonomousWorkerState;
  roadmapId: string | null;
  roadmapTitle: string | null;
  currentTaskId: string | null;
  completedTaskCount: number;
  failedTaskCount: number;
  pendingTaskCount: number;
  pauseReason: string | null;
  stopReason: string | null;
  startedAt: ISODateTime | null;
  updatedAt: ISODateTime;
}

export interface AutonomousWorkerReport {
  roadmapId: string;
  roadmapTitle: string;
  workerState: AutonomousWorkerState;
  completedTaskCount: number;
  failedTaskCount: number;
  pendingTaskCount: number;
  currentTaskId: string | null;
  pauseReason: string | null;
  stopReason: string | null;
  taskReports: AutonomousWorkerTaskReport[];
  nextRecommendedAction: string;
}

export interface AutonomousWorkerSnapshot {
  instanceId: string;
  state: AutonomousWorkerState;
  roadmapId: string | null;
  roadmapTitle: string | null;
  currentTaskId: string | null;
  completedTaskCount: number;
  failedTaskCount: number;
  pendingTaskCount: number;
  pauseReason: string | null;
  stopReason: string | null;
  startedAt: ISODateTime | null;
  updatedAt: ISODateTime;
}

export interface AutonomousWorkerCommandRunner {
  lint(): AutonomousWorkerCommandResult;
  build(): AutonomousWorkerCommandResult;
  test(): AutonomousWorkerCommandResult;
}

export interface AutonomousWorkerOptions {
  instanceId?: string;
  planner?: AutomationPlanner;
  aiTaskExecutorAdapter?: AITaskExecutorAdapter;
  taskHandler?: RoadmapTaskExecutionHandler;
  taskExecutor?: RoadmapTaskExecutor;
  commandRunner?: CommandRunner;
  cwd?: string;
  organizationId?: string;
}

export interface SerializedAutonomousWorkerCommandResult {
  success: boolean;
  command: string;
  args: string[];
  exitCode: number;
  stdout: string | null;
  stderr: string | null;
  errors: string[];
  warnings: string[];
  output: string | null;
  durationMs: number;
}

export interface SerializedAutonomousWorkerExecutorResult {
  success: boolean;
  files: string[];
  errors: string[];
  warnings: string[];
  output: string | null;
  durationMs: number;
  status?: 'completed' | 'failed' | 'prepared';
}

export interface SerializedAutonomousWorkerTaskReport {
  taskId: string;
  sprintId: string;
  code: string;
  title: string;
  status: 'completed' | 'failed' | 'prepared';
  durationMs: number;
  files: string[];
  errors: string[];
  warnings: string[];
  lint: SerializedAutonomousWorkerCommandResult | null;
  build: SerializedAutonomousWorkerCommandResult | null;
  tests: SerializedAutonomousWorkerCommandResult | null;
  executor: SerializedAutonomousWorkerExecutorResult;
}

export interface SerializedAutonomousWorkerReport {
  roadmapId: string;
  roadmapTitle: string;
  workerState: AutonomousWorkerState;
  completedTaskCount: number;
  failedTaskCount: number;
  pendingTaskCount: number;
  currentTaskId: string | null;
  pauseReason: string | null;
  stopReason: string | null;
  taskReports: SerializedAutonomousWorkerTaskReport[];
  nextRecommendedAction: string;
}

export interface SerializedAutonomousWorkerStatusView {
  state: AutonomousWorkerState;
  roadmapId: string | null;
  roadmapTitle: string | null;
  currentTaskId: string | null;
  completedTaskCount: number;
  failedTaskCount: number;
  pendingTaskCount: number;
  pauseReason: string | null;
  stopReason: string | null;
  startedAt: ISODateTime | null;
  updatedAt: ISODateTime;
}

export interface SerializedAutonomousWorkerSnapshot {
  instanceId: string;
  state: AutonomousWorkerState;
  roadmapId: string | null;
  roadmapTitle: string | null;
  currentTaskId: string | null;
  completedTaskCount: number;
  failedTaskCount: number;
  pendingTaskCount: number;
  pauseReason: string | null;
  stopReason: string | null;
  startedAt: ISODateTime | null;
  updatedAt: ISODateTime;
  report: SerializedAutonomousWorkerReport | null;
}
