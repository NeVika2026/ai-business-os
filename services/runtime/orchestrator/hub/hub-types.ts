import type { ISODateTime, UUID } from '@/types/runtime/dto';
import type { AutomationPolicy } from '@/services/runtime/orchestrator/automation/automation-policy';
import type {
  AutomationReport,
  AutomationRunUntilStopResult,
  AutomationStatusView,
} from '@/services/runtime/orchestrator/automation/automation-types';
import type {
  RoadmapSprintInput,
  RoadmapSprintPlan,
} from '@/services/runtime/orchestrator/roadmap/roadmap-types';
import type {
  RunnerRunResult,
  RunnerStatusView,
} from '@/services/runtime/orchestrator/runner/runtime-runner-types';

export type HubExecutionPhase = 'runtime' | 'automation' | 'completed' | 'failed' | 'paused';

export interface HubRuntimeContext {
  organizationId: UUID;
  employeeId: UUID;
  runId: UUID;
  traceId: UUID;
  startedAt?: ISODateTime;
}

export interface HubSprintInput {
  sprint: RoadmapSprintInput;
  runtimeContext?: HubRuntimeContext | null;
  skipRuntime?: boolean;
}

export interface HubExecutionRecord {
  sprintId: string;
  sprintCode: string;
  planId: string;
  phase: HubExecutionPhase;
  runnerResult: RunnerRunResult | null;
  automationResult: AutomationRunUntilStopResult | null;
  automationReport: AutomationReport | null;
  startedAt: ISODateTime;
  updatedAt: ISODateTime;
  finishedAt: ISODateTime | null;
}

export interface HubExecutionResult {
  sprintId: string;
  sprintCode: string;
  planId: string;
  phase: HubExecutionPhase;
  finished: boolean;
  paused: boolean;
  failed: boolean;
  runnerExecutedTasks: string[];
  automationStepsExecuted: number;
  stopReason: string | null;
  nextRecommendedAction: string | null;
}

export interface HubStatusView {
  activeSprintId: string | null;
  activeSprintCode: string | null;
  phase: HubExecutionPhase;
  runnerStatus: RunnerStatusView | null;
  automationStatus: AutomationStatusView | null;
  lastExecution: HubExecutionResult | null;
}

export interface HubReport {
  sprintId: string | null;
  sprintCode: string | null;
  phase: HubExecutionPhase;
  runner: {
    finished: boolean;
    executedTasks: string[];
    duration: number;
    finalStatus: string | null;
  } | null;
  automation: AutomationReport | null;
  nextRecommendedAction: string | null;
}

export interface HubProvider {
  save(record: HubExecutionRecord): void;
  update(record: HubExecutionRecord): void;
  get(sprintId: string): HubExecutionRecord | null;
  reset?(): void;
}

export interface OrchestratorHubOptions {
  provider?: HubProvider;
  policy?: AutomationPolicy;
  skipRuntime?: boolean;
}

export type { RoadmapSprintPlan };
