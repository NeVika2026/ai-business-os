import type { AgentRunStatus } from '@/types/ai';

export const ORCHESTRATOR_EVENT_TYPES = ['run_started', 'run_completed', 'run_failed'] as const;

export type OrchestratorEventType = (typeof ORCHESTRATOR_EVENT_TYPES)[number];

export const OSA_EVENT_TYPES = [
  'osa_task_submitted',
  'osa_team_selected',
  'osa_runtime_started',
  'osa_runtime_completed',
  'osa_runtime_failed',
] as const;

export type OsaEventType = (typeof OSA_EVENT_TYPES)[number];

export type OrchestratorEvent = {
  id: string;
  organization_id: string;
  type: string;
  source: string;
  actor_type: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  correlation_id: string | null;
  created_at: string;
};

export type OrchestratorRunEmployee = {
  id: string;
  name: string;
  role_title: string;
};

export type OrchestratorRun = {
  id: string;
  organization_id: string;
  ai_employee_id: string;
  status: AgentRunStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error_message: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  employee: OrchestratorRunEmployee | null;
};

export type OrchestratorStats = {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  runningRuns: number;
  todayRuns: number;
};

export type OrchestratorMemorySnapshot = {
  id: string;
  scope: string;
  content: string;
  importance: number;
  created_at: string;
};

export type OrchestratorKnowledgeSource = {
  id: string;
  title: string;
  type: string;
  status: string;
  items_count: number;
  chunks_count: number;
};

export const ORCHESTRATOR_EVENT_LABELS: Record<OrchestratorEventType, string> = {
  run_started: 'Run Started',
  run_completed: 'Run Completed',
  run_failed: 'Run Failed',
};

export const OSA_EVENT_LABELS: Record<OsaEventType, string> = {
  osa_task_submitted: 'Задача отправлена',
  osa_team_selected: 'Команда выбрана',
  osa_runtime_started: 'Runtime запущен',
  osa_runtime_completed: 'Runtime завершён',
  osa_runtime_failed: 'Runtime ошибка',
};

export const RUN_EVENT_LABELS: Record<string, string> = {
  ...ORCHESTRATOR_EVENT_LABELS,
  ...OSA_EVENT_LABELS,
};
