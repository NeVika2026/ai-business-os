export const AI_EMPLOYEE_STATUSES = ['active', 'inactive'] as const;

export type AiEmployeeStatus = (typeof AI_EMPLOYEE_STATUSES)[number];

export const AGENT_RUN_STATUSES = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;

export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export const MEMORY_SCOPES = ['organization', 'ai_employee', 'project'] as const;

export type MemoryScope = (typeof MEMORY_SCOPES)[number];

export const AVAILABLE_TOOLS = [
  { id: 'web_search', label: 'Web Search' },
  { id: 'crm_read', label: 'CRM Read' },
  { id: 'knowledge_search', label: 'Knowledge Search' },
] as const;

export type AiProvider = {
  id: string;
  code: string;
  name: string;
  website: string | null;
  is_active: boolean;
};

export type AiModel = {
  id: string;
  provider_id: string;
  code: string;
  name: string;
  context_window: number | null;
  supports_tools: boolean;
  is_active: boolean;
};

export type AiEmployeeConfiguration = {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  description?: string;
};

export type AiEmployeeMemory = {
  enabled?: boolean;
  scope?: MemoryScope | string;
  retention_days?: number;
};

export type AiEmployeeTool = {
  id: string;
  enabled: boolean;
};

export type AiEmployeePermissions = Record<string, boolean>;

export type AiEmployee = {
  id: string;
  organization_id: string;
  project_id: string | null;
  provider_id: string;
  model_id: string;
  name: string;
  role_title: string;
  system_prompt: string | null;
  configuration: AiEmployeeConfiguration;
  memory: AiEmployeeMemory;
  tools: AiEmployeeTool[];
  permissions: AiEmployeePermissions;
  avatar_url: string | null;
  color: string | null;
  status: AiEmployeeStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  provider: AiProvider | null;
  model: AiModel | null;
  last_run_at: string | null;
};

export type AgentRun = {
  id: string;
  organization_id: string;
  ai_employee_id: string;
  status: AgentRunStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  tokens_input: number | null;
  tokens_output: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type AgentMemory = {
  id: string;
  organization_id: string;
  ai_employee_id: string | null;
  scope: string;
  content: string;
  importance: number;
  last_used_at: string | null;
  created_at: string;
};

export type AiEmployeeStats = {
  totalEmployees: number;
  activeEmployees: number;
  disabledEmployees: number;
  providersUsed: number;
  modelsUsed: number;
};

export const AI_EMPLOYEE_STATUS_LABELS: Record<AiEmployeeStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

export const AGENT_RUN_STATUS_LABELS: Record<AgentRunStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const MEMORY_SCOPE_LABELS: Record<MemoryScope, string> = {
  organization: 'Organization',
  ai_employee: 'AI Employee',
  project: 'Project',
};
