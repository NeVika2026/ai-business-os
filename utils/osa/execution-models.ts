/**
 * OSA execution model ownership:
 *
 * - ExecutionPlan (`execution-planner.ts`): strategic multi-stage plan with agents, risks, and ETA.
 * - ExecutionGraph (`team-execution.ts`): task-level DAG derived from a plan.
 * - ExecutionSession (`team-runtime.ts`): coordinator state while walking a graph stage-by-stage.
 * - ExecutionProgress (`execution-progress.ts`): UI/history snapshot derived from a session.
 * - ExecutionControls (`execution-controls.ts`): user-facing pause/resume/cancel/retry/restart API.
 */

export type {
  ExecutionMode,
  ExecutionPlan,
  ExecutionRisk,
  ExecutionRiskSeverity,
  ExecutionStage as PlanExecutionStage,
  ExecutionStageStatus,
} from '@/utils/osa/execution-planner';

export type {
  ExecutionGraph,
  ExecutionGraphProgress,
  ExecutionGraphStage,
  ExecutionResult,
  ExecutionTask,
  ExecutionTaskStatus,
} from '@/utils/osa/team-execution';

export type {
  ExecutionCoordinator,
  ExecutionSession,
  ExecutionSnapshot,
  ExecutionState,
  ExecutionStep,
  ExecutionStepStatus,
  PreparedRuntimeCall,
} from '@/utils/osa/team-runtime';
