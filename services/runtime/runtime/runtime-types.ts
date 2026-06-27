import type { ISODateTime, UUID } from '@/types/runtime/dto';
import type { HubExecutionResult, HubReport } from '@/services/runtime/orchestrator/hub/hub-types';
import type {
  RoadmapInput,
  RoadmapSprintInput,
} from '@/services/runtime/orchestrator/roadmap/roadmap-types';
import type {
  RoadmapSessionReport,
  RoadmapSessionRunResult,
  RoadmapSessionStatus,
} from '@/services/runtime/orchestrator/session/roadmap-session-types';

export type RuntimeMode = 'idle' | 'roadmap' | 'sprint';

export interface RuntimeExecutionContext {
  organizationId: UUID;
  employeeId: UUID;
  runId: UUID;
  traceId: UUID;
  startedAt?: ISODateTime;
}

export interface RuntimeExecuteRoadmapInput {
  roadmap: RoadmapInput;
  runtimeContext: RuntimeExecutionContext;
  skipRuntime?: boolean;
}

export interface RuntimeExecuteSprintInput {
  sprint: RoadmapSprintInput;
  runtimeContext: RuntimeExecutionContext;
  skipRuntime?: boolean;
}

export interface RuntimeExecuteRoadmapResult {
  roadmapId: string;
  sessionStatus: RoadmapSessionStatus;
  sprintsExecuted: number;
  stopped: boolean;
  reason: string | null;
}

export type RuntimeExecuteSprintResult = HubExecutionResult;

export interface RuntimeStatusView {
  mode: RuntimeMode;
  roadmapId: string | null;
  sprintId: string | null;
  sessionStatus: RoadmapSessionStatus | null;
  hubPhase: string | null;
  coordinatorStatus: string | null;
  runnerStatus: string | null;
  automationStatus: string | null;
  stateMachineState: string | null;
}

export interface RuntimeReport {
  mode: RuntimeMode;
  roadmapId: string | null;
  sprintId: string | null;
  nextRecommendedAction: string | null;
  sessionReport: RoadmapSessionReport | null;
  hubReport: HubReport | null;
}

export interface SerializedRuntimeRecord {
  mode: RuntimeMode;
  roadmapId: string | null;
  sprintId: string | null;
  lastRoadmapResult: RoadmapSessionRunResult | null;
  lastSprintResult: HubExecutionResult | null;
  updatedAt: string;
}

export interface SerializedRuntimeSnapshot {
  runtime: SerializedRuntimeRecord;
  status: RuntimeStatusView;
}

export interface RuntimeRecord {
  mode: RuntimeMode;
  roadmapId: string | null;
  sprintId: string | null;
  lastRoadmapResult: RoadmapSessionRunResult | null;
  lastSprintResult: HubExecutionResult | null;
  updatedAt: ISODateTime;
}

export interface RuntimeProvider {
  save(instanceId: string, record: RuntimeRecord): void;
  update(instanceId: string, record: RuntimeRecord): void;
  get(instanceId: string): RuntimeRecord | null;
  reset?(): void;
}

export interface RuntimeFactoryOptions {
  stateProvider?: import('@/services/runtime/orchestrator/state/runtime-state-types').RuntimeStateProvider;
  coordinatorProvider?: import('@/services/runtime/orchestrator/coordinator/runtime-coordinator-types').CoordinatorProvider;
  orchestratorProvider?: import('@/services/runtime/orchestrator/engine/runtime-orchestrator-types').OrchestratorProvider;
  eventProvider?: import('@/services/runtime/orchestrator/events/runtime-event-types').RuntimeEventProvider;
  hubProvider?: import('@/services/runtime/orchestrator/hub/hub-types').HubProvider;
  sessionProvider?: import('@/services/runtime/orchestrator/session/roadmap-session-types').RoadmapSessionProvider;
  runtimeProvider?: RuntimeProvider;
  policy?: import('@/services/runtime/orchestrator/automation/automation-policy').AutomationPolicy;
  skipRuntime?: boolean;
  maxSprintsPerRun?: number;
}

export interface RuntimeOptions extends RuntimeFactoryOptions {
  instanceId?: string;
}

export const DEFAULT_RUNTIME_INSTANCE_ID = 'default';
