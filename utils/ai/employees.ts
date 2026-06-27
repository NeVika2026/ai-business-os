import type {
  AgentMemory,
  AgentRun,
  AiEmployee,
  AiEmployeeConfiguration,
  AiEmployeeMemory,
  AiEmployeeStats,
  AiEmployeeTool,
  AiModel,
  AiProvider,
} from '@/types/ai';

type RawProvider = AiProvider | AiProvider[] | null;
type RawModel = AiModel | AiModel[] | null;

type RawAiEmployee = Omit<
  AiEmployee,
  'provider' | 'model' | 'last_run_at' | 'configuration' | 'memory' | 'tools' | 'permissions'
> & {
  configuration: AiEmployeeConfiguration | null;
  memory: AiEmployeeMemory | null;
  tools: AiEmployeeTool[] | null;
  permissions: Record<string, boolean> | null;
  provider: RawProvider;
  model: RawModel;
};

export function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export function mapAiEmployees(
  rows: RawAiEmployee[],
  lastRunByEmployee: Record<string, string> = {},
): AiEmployee[] {
  return rows.map((row) => ({
    ...row,
    configuration: row.configuration ?? {},
    memory: row.memory ?? {},
    tools: row.tools ?? [],
    permissions: row.permissions ?? {},
    provider: normalizeRelation(row.provider),
    model: normalizeRelation(row.model),
    last_run_at: lastRunByEmployee[row.id] ?? null,
  }));
}

export function mapAgentRuns(rows: AgentRun[]): AgentRun[] {
  return rows;
}

export function mapAgentMemories(rows: AgentMemory[]): AgentMemory[] {
  return rows;
}

export function buildLastRunMap(
  runs: {
    ai_employee_id: string;
    completed_at: string | null;
    started_at: string | null;
    created_at: string;
  }[],
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const run of runs) {
    if (map[run.ai_employee_id]) {
      continue;
    }

    map[run.ai_employee_id] = run.completed_at ?? run.started_at ?? run.created_at;
  }

  return map;
}

export function computeAiEmployeeStats(employees: AiEmployee[]): AiEmployeeStats {
  const providerIds = new Set<string>();
  const modelIds = new Set<string>();

  let activeEmployees = 0;
  let disabledEmployees = 0;

  for (const employee of employees) {
    if (employee.status === 'active' && employee.is_active) {
      activeEmployees += 1;
    } else {
      disabledEmployees += 1;
    }

    providerIds.add(employee.provider_id);
    modelIds.add(employee.model_id);
  }

  return {
    totalEmployees: employees.length,
    activeEmployees,
    disabledEmployees,
    providersUsed: providerIds.size,
    modelsUsed: modelIds.size,
  };
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatMemorySummary(memory: AiEmployeeMemory) {
  if (!memory.enabled) {
    return 'Выключена';
  }

  const scope = memory.scope ?? 'ai_employee';
  const days = memory.retention_days ?? 30;

  return `Вкл · ${scope} · ${days}д`;
}

export function formatToolsSummary(tools: AiEmployeeTool[]) {
  const enabled = tools.filter((tool) => tool.enabled);

  if (enabled.length === 0) {
    return '—';
  }

  return enabled.map((tool) => tool.id).join(', ');
}

export const EMPLOYEE_SELECT = `
  id,
  organization_id,
  project_id,
  provider_id,
  model_id,
  name,
  role_title,
  system_prompt,
  configuration,
  memory,
  tools,
  permissions,
  avatar_url,
  color,
  status,
  is_active,
  created_at,
  updated_at,
  provider:provider_id (
    id,
    code,
    name,
    website,
    is_active
  ),
  model:model_id (
    id,
    provider_id,
    code,
    name,
    context_window,
    supports_tools,
    is_active
  )
`;
