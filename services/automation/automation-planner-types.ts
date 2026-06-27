import type { ISODateTime } from '@/types/runtime/dto';

export type AutomationPlannerTaskState =
  | 'pending'
  | 'ready'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'skipped';

export type AutomationPlannerMetadataValue = string | number | boolean | null;

export interface AutomationPlannerTask {
  id: string;
  title: string;
  description: string | null;
  dependencies: string[];
  status: AutomationPlannerTaskState;
  priority: number;
  order: number;
  metadata: Record<string, AutomationPlannerMetadataValue>;
}

export interface AutomationPlannerInput {
  roadmapId: string;
  roadmapTitle: string;
  tasks: AutomationPlannerTask[];
}

export interface AutomationPlannerPlanResult {
  nextTask: AutomationPlannerTask | null;
  blockedTasks: AutomationPlannerTask[];
  readyTasks: AutomationPlannerTask[];
  completedTasks: AutomationPlannerTask[];
  remainingTasks: AutomationPlannerTask[];
  executionOrder: string[];
}

export interface AutomationPlannerStatistics {
  totalTasks: number;
  completed: number;
  failed: number;
  blocked: number;
  ready: number;
  pending: number;
  remaining: number;
}

export interface AutomationPlannerReport {
  instanceId: string;
  roadmapId: string | null;
  roadmapTitle: string | null;
  statistics: AutomationPlannerStatistics;
  nextTaskId: string | null;
  blockedTaskIds: string[];
  readyTaskIds: string[];
  completedTaskIds: string[];
  remainingTaskIds: string[];
  executionOrder: string[];
  updatedAt: ISODateTime;
}

export interface AutomationPlannerSnapshot {
  instanceId: string;
  roadmapId: string | null;
  roadmapTitle: string | null;
  planned: boolean;
  statistics: AutomationPlannerStatistics;
  nextTaskId: string | null;
  updatedAt: ISODateTime;
}

export interface AutomationPlannerOptions {
  instanceId?: string;
}

export interface SerializedAutomationPlannerTask {
  id: string;
  title: string;
  description: string | null;
  dependencies: string[];
  status: AutomationPlannerTaskState;
  priority: number;
  order: number;
  metadata: Record<string, AutomationPlannerMetadataValue>;
}

export interface SerializedAutomationPlannerPlanResult {
  nextTask: SerializedAutomationPlannerTask | null;
  blockedTasks: SerializedAutomationPlannerTask[];
  readyTasks: SerializedAutomationPlannerTask[];
  completedTasks: SerializedAutomationPlannerTask[];
  remainingTasks: SerializedAutomationPlannerTask[];
  executionOrder: string[];
}

export interface SerializedAutomationPlannerStatistics {
  totalTasks: number;
  completed: number;
  failed: number;
  blocked: number;
  ready: number;
  pending: number;
  remaining: number;
}

export interface SerializedAutomationPlannerReport {
  instanceId: string;
  roadmapId: string | null;
  roadmapTitle: string | null;
  statistics: SerializedAutomationPlannerStatistics;
  nextTaskId: string | null;
  blockedTaskIds: string[];
  readyTaskIds: string[];
  completedTaskIds: string[];
  remainingTaskIds: string[];
  executionOrder: string[];
  updatedAt: ISODateTime;
}

export interface SerializedAutomationPlannerSnapshot {
  instanceId: string;
  roadmapId: string | null;
  roadmapTitle: string | null;
  planned: boolean;
  statistics: SerializedAutomationPlannerStatistics;
  nextTaskId: string | null;
  updatedAt: ISODateTime;
  plan: SerializedAutomationPlannerPlanResult | null;
  report: SerializedAutomationPlannerReport;
}
