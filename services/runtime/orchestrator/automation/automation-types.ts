import type { ISODateTime } from '@/types/runtime/dto';

export type AutomationStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';

export type AutomationStepType = 'implement' | 'lint' | 'build' | 'commit' | 'validate' | 'custom';

export type AutomationStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'blocked';

export interface AutomationStepInput {
  id: string;
  title: string;
  type: AutomationStepType;
  dependsOn?: string[];
  maxAttempts?: number;
  outcome?: 'success' | 'failure';
}

export interface AutomationPlanInput {
  id: string;
  title: string;
  steps: AutomationStepInput[];
}

export interface AutomationStepState {
  id: string;
  title: string;
  type: AutomationStepType;
  status: AutomationStepStatus;
  dependsOn: string[];
  attempts: number;
  maxAttempts: number;
  outcome: 'success' | 'failure' | null;
  lastError: string | null;
  completedAt: ISODateTime | null;
}

export interface AutomationPlanState {
  id: string;
  title: string;
  steps: AutomationStepState[];
  currentStepId: string | null;
  status: AutomationStatus;
}

export interface AutomationSession {
  plan: AutomationPlanState;
  controllerStatus: AutomationStatus;
  stepsExecutedThisRun: number;
  pauseReason: string | null;
  stopReason: string | null;
  startedAt: ISODateTime | null;
  updatedAt: ISODateTime;
  stoppedAt: ISODateTime | null;
}

export interface AutomationNextResult {
  executed: boolean;
  stepId: string | null;
  stepStatus: AutomationStepStatus | null;
  controllerStatus: AutomationStatus;
  stopped: boolean;
  reason: string | null;
}

export interface AutomationRunUntilStopResult {
  stepsExecuted: number;
  controllerStatus: AutomationStatus;
  stopped: boolean;
  reason: string | null;
}

export interface AutomationStatusView {
  status: AutomationStatus;
  planId: string | null;
  planTitle: string | null;
  currentStepId: string | null;
  stepsExecutedThisRun: number;
  pauseReason: string | null;
  stopReason: string | null;
  completedStepCount: number;
  failedStepCount: number;
  pendingStepCount: number;
}

export interface AutomationReportStep {
  id: string;
  title: string;
  type: AutomationStepType;
  status: AutomationStepStatus;
  attempts: number;
  lastError: string | null;
}

export interface AutomationReport {
  planId: string;
  planTitle: string;
  status: AutomationStatus;
  executedSteps: AutomationReportStep[];
  failedSteps: AutomationReportStep[];
  pendingSteps: AutomationReportStep[];
  blockedSteps: AutomationReportStep[];
  nextRecommendedAction: string;
  stopReason: string | null;
  pauseReason: string | null;
  stepsExecutedThisRun: number;
  currentStepId: string | null;
}

export interface AutomationProvider {
  save(session: AutomationSession): void;
  update(session: AutomationSession): void;
  get(planId: string): AutomationSession | null;
  reset?(): void;
}
