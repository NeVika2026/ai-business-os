import type {
  AutonomousWorkerState,
  AutonomousWorkerTask,
  AutonomousWorkerTaskReport,
} from '@/services/automation/autonomous-worker-types';
import type { SerializedAutomationPlannerSnapshot } from '@/services/automation/automation-planner-types';
import type { RoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-types';

export const WORKER_CHECKPOINT_STAGE = 'worker';

export interface WorkerCheckpointPayload {
  instanceId: string;
  organizationId: string;
  roadmap: RoadmapInput;
  tasks: AutonomousWorkerTask[];
  taskReports: AutonomousWorkerTaskReport[];
  state: AutonomousWorkerState;
  currentTaskId: string | null;
  pauseReason: string | null;
  stopReason: string | null;
  startedAt: string | null;
  plannerSnapshot: SerializedAutomationPlannerSnapshot | null;
}

export function buildWorkerRunId(instanceId: string, roadmapId: string): string {
  return `worker:${instanceId}:${roadmapId}`;
}
