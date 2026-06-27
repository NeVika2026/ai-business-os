import type { ISODateTime } from '@/types/runtime/dto';
import type {
  HubExecutionResult,
  HubRuntimeContext,
} from '@/services/runtime/orchestrator/hub/hub-types';
import type {
  RoadmapInput,
  RoadmapSprintStatus,
} from '@/services/runtime/orchestrator/roadmap/roadmap-types';

export type RoadmapSessionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'stopped';

export interface RoadmapSessionStartInput {
  roadmap: RoadmapInput;
  runtimeContext?: HubRuntimeContext | null;
  skipRuntime?: boolean;
}

export interface RoadmapSprintExecutionRecord {
  sprintId: string;
  sprintCode: string;
  status: RoadmapSprintStatus;
  result: HubExecutionResult | null;
  startedAt: ISODateTime | null;
  finishedAt: ISODateTime | null;
}

export interface RoadmapSessionRecord {
  roadmapId: string;
  roadmapTitle: string;
  status: RoadmapSessionStatus;
  currentSprintId: string | null;
  completedSprintIds: string[];
  failedSprintIds: string[];
  sprintRecords: RoadmapSprintExecutionRecord[];
  pauseReason: string | null;
  stopReason: string | null;
  startedAt: ISODateTime | null;
  updatedAt: ISODateTime;
  finishedAt: ISODateTime | null;
}

export interface RoadmapSessionNextResult {
  executed: boolean;
  sprintId: string | null;
  sprintCode: string | null;
  sessionStatus: RoadmapSessionStatus;
  stopped: boolean;
  reason: string | null;
  execution: HubExecutionResult | null;
}

export interface RoadmapSessionRunResult {
  sprintsExecuted: number;
  sessionStatus: RoadmapSessionStatus;
  stopped: boolean;
  reason: string | null;
}

export interface RoadmapSessionStatusView {
  status: RoadmapSessionStatus;
  roadmapId: string | null;
  roadmapTitle: string | null;
  currentSprintId: string | null;
  completedSprintCount: number;
  failedSprintCount: number;
  pendingSprintCount: number;
  pauseReason: string | null;
  stopReason: string | null;
}

export interface RoadmapSessionReportSprint {
  sprintId: string;
  sprintCode: string;
  status: RoadmapSprintStatus;
  nextRecommendedAction: string | null;
}

export interface RoadmapSessionReport {
  roadmapId: string;
  roadmapTitle: string;
  status: RoadmapSessionStatus;
  completedSprints: RoadmapSessionReportSprint[];
  failedSprints: RoadmapSessionReportSprint[];
  pendingSprints: RoadmapSessionReportSprint[];
  nextRecommendedAction: string;
  pauseReason: string | null;
  stopReason: string | null;
}

export interface RoadmapSessionProvider {
  save(record: RoadmapSessionRecord): void;
  update(record: RoadmapSessionRecord): void;
  get(roadmapId: string): RoadmapSessionRecord | null;
  reset?(): void;
}

export interface RoadmapSessionOptions {
  provider?: RoadmapSessionProvider;
  maxSprintsPerRun?: number;
  skipRuntime?: boolean;
}

export const DEFAULT_MAX_SPRINTS_PER_RUN = 10;
