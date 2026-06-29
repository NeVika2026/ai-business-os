import type { AgentRunStatus } from '@/types/ai';
import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import { RUN_EVENT_LABELS } from '@/types/orchestrator';
import { CABINET_MODULES, CABINET_QUICK_ACTIONS } from '@/utils/cabinet/cabinet-config';
import { isOsaRun } from '@/utils/osa/osa-runs';
import { formatDateTime, formatDuration } from '@/utils/orchestrator/runs';

export type HealthDisplayStatus = 'healthy' | 'warning' | 'offline' | 'unknown';

export type ActivityCategory = 'osa' | 'projects' | 'documents' | 'automation' | 'other';

export type DashboardOverviewMetrics = {
  activeExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  executionTimeTodayMs: number;
  totalAiRuns: number;
};

export type ActivityItem = {
  id: string;
  category: ActivityCategory;
  title: string;
  subtitle: string;
  timestamp: string;
  href: string | null;
};

export type UsageStatsData = {
  todayRuns: number;
  weekRuns: number;
  monthRuns: number;
  averageRuntimeMs: number | null;
  successRate: number | null;
  totalCredits: number | null;
};

export type QuickActionWithCount = {
  id: string;
  label: string;
  href: string;
  icon: string;
  count: number;
};

export type ProfileSummaryData = {
  email: string;
  organizationName: string;
  subscription: string;
  workspaceCount: number;
  projectCount: number;
  agentCount: number;
  executionCount: number;
  createdAt: string | null;
};

export type ModuleWithCount = {
  id: string;
  label: string;
  href: string;
  icon: string;
  description: string;
  pinned?: boolean;
  count: number;
};

export type WorkspaceCardData = {
  name: string;
  status: string;
  lastActive: string | null;
  lastExecution: string | null;
  currentProject: string | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  unread: boolean;
  href: string | null;
};

export type ExecutionHistoryItem = {
  id: string;
  status: AgentRunStatus;
  label: string;
  mode: string;
  timestamp: string;
  duration: string;
  href: string;
};

export type SystemHealthSnapshot = {
  database: HealthDisplayStatus;
  gateway: HealthDisplayStatus;
  runtime: HealthDisplayStatus;
  memory: HealthDisplayStatus;
  knowledge: HealthDisplayStatus;
  automation: HealthDisplayStatus;
};

export type CabinetOrganizationRow = {
  id: string;
  name: string;
  settings: Record<string, unknown> | null;
  created_at: string;
};

export type CabinetProjectRow = {
  id: string;
  name: string;
  status: string;
  project_type: string;
  created_at: string;
  updated_at: string;
};

export type CabinetRawSnapshot = {
  runs: OrchestratorRun[];
  events: OrchestratorEvent[];
  organization: CabinetOrganizationRow | null;
  projects: CabinetProjectRow[];
  projectCount: number;
  workspaceCount: number;
  agentCount: number;
  documentCount: number;
  knowledgeSourceCount: number;
  crmLeadCount: number;
  memoryCount: number;
  health: SystemHealthSnapshot;
  userEmail: string;
};

export type CabinetDashboardData = {
  overview: DashboardOverviewMetrics;
  activity: ActivityItem[];
  usage: UsageStatsData;
  quickActions: QuickActionWithCount[];
  profile: ProfileSummaryData;
  health: Array<{ id: string; label: string; status: HealthDisplayStatus }>;
  modules: ModuleWithCount[];
  workspace: WorkspaceCardData;
  notifications: NotificationItem[];
  history: ExecutionHistoryItem[];
};

const RUNNING_STATUSES = new Set<AgentRunStatus>(['pending', 'running']);
const TERMINAL_STATUSES = new Set<AgentRunStatus>(['completed', 'failed', 'cancelled']);

const ACTIVITY_EVENT_LIMIT = 15;
const NOTIFICATION_LIMIT = 10;
const HISTORY_LIMIT = 10;

const NOISE_EVENT_TYPES = new Set(['osa_progress_updated']);

export const HEALTH_STATUS_LABELS: Record<HealthDisplayStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  offline: 'Offline',
  unknown: 'Unknown',
};

export const HEALTH_STATUS_STYLES: Record<HealthDisplayStatus, string> = {
  healthy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  offline: 'border-red-500/30 bg-red-500/10 text-red-700',
  unknown: 'border-[var(--border-subtle)] bg-[var(--surface-0)] text-[var(--text-secondary)]',
};

function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isWithinDays(value: string, days: number): boolean {
  const date = new Date(value).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return date >= cutoff;
}

function runDurationMs(run: OrchestratorRun): number | null {
  if (!run.started_at || !run.completed_at) {
    return null;
  }

  const duration = new Date(run.completed_at).getTime() - new Date(run.started_at).getTime();

  return duration >= 0 ? duration : null;
}

function resolveSubscription(settings: Record<string, unknown> | null): string {
  if (!settings) {
    return 'Free';
  }

  const subscription = settings.subscription ?? settings.plan;

  if (typeof subscription === 'string' && subscription.trim().length > 0) {
    return subscription;
  }

  if (subscription && typeof subscription === 'object') {
    const name = (subscription as { name?: unknown }).name;

    if (typeof name === 'string' && name.trim().length > 0) {
      return name;
    }
  }

  return 'Free';
}

function resolveRunLabel(run: OrchestratorRun): string {
  if (isOsaRun(run)) {
    const prompt = run.input.user_prompt;

    if (typeof prompt === 'string' && prompt.trim().length > 0) {
      return prompt.trim();
    }

    return 'Completed work';
  }

  const action = run.input.action;

  if (typeof action === 'string' && action.trim().length > 0) {
    return action;
  }

  return run.employee?.name ?? 'Agent run';
}

function resolveRunMode(run: OrchestratorRun): string {
  if (run.input.runtime_bridge_enabled === true || run.output?.runtime_bridge_enabled === true) {
    return 'Runtime';
  }

  if (run.input.simulated === true || run.output?.simulated === true) {
    return 'Demo';
  }

  return 'Standard';
}

function isUnreadEvent(event: OrchestratorEvent): boolean {
  if (event.metadata && typeof event.metadata === 'object') {
    const read = (event.metadata as Record<string, unknown>).read;

    if (read === true) {
      return false;
    }
  }

  return true;
}

export function classifyActivityCategory(event: OrchestratorEvent): ActivityCategory {
  if (event.source === 'osa' || event.type.startsWith('osa_')) {
    return 'osa';
  }

  if (event.type.startsWith('project_') || event.source === 'projects') {
    return 'projects';
  }

  if (
    event.type.startsWith('knowledge_') ||
    event.source === 'knowledge' ||
    event.type.includes('document')
  ) {
    return 'documents';
  }

  if (
    event.type.startsWith('run_') ||
    event.source === 'orchestrator' ||
    event.source === 'automation'
  ) {
    return 'automation';
  }

  return 'other';
}

export function mapRunsToOverviewMetrics(runs: OrchestratorRun[]): DashboardOverviewMetrics {
  const activeExecutions = runs.filter((run) => RUNNING_STATUSES.has(run.status)).length;
  const completedExecutions = runs.filter((run) => run.status === 'completed').length;
  const failedExecutions = runs.filter((run) => run.status === 'failed').length;

  const executionTimeTodayMs = runs
    .filter((run) => run.completed_at && isToday(run.completed_at))
    .reduce((total, run) => total + (runDurationMs(run) ?? 0), 0);

  return {
    activeExecutions,
    completedExecutions,
    failedExecutions,
    executionTimeTodayMs,
    totalAiRuns: runs.length,
  };
}

export function mapRunsToUsageStats(runs: OrchestratorRun[]): UsageStatsData {
  const todayRuns = runs.filter((run) => isToday(run.created_at)).length;
  const weekRuns = runs.filter((run) => isWithinDays(run.created_at, 7)).length;
  const monthRuns = runs.filter((run) => isWithinDays(run.created_at, 30)).length;

  const completedRuns = runs.filter((run) => run.status === 'completed');
  const durations = completedRuns
    .map((run) => runDurationMs(run))
    .filter((value): value is number => value !== null);

  const averageRuntimeMs =
    durations.length > 0
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : null;

  const finishedRuns = runs.filter((run) => TERMINAL_STATUSES.has(run.status));
  const successRate =
    finishedRuns.length > 0
      ? Math.round(
          (finishedRuns.filter((run) => run.status === 'completed').length / finishedRuns.length) *
            100,
        )
      : null;

  return {
    todayRuns,
    weekRuns,
    monthRuns,
    averageRuntimeMs,
    successRate,
    totalCredits: null,
  };
}

export function mapEventsToActivity(events: OrchestratorEvent[]): ActivityItem[] {
  return events
    .filter((event) => !NOISE_EVENT_TYPES.has(event.type))
    .slice(0, ACTIVITY_EVENT_LIMIT)
    .map((event) => ({
      id: event.id,
      category: classifyActivityCategory(event),
      title:
        RUN_EVENT_LABELS[event.type as keyof typeof RUN_EVENT_LABELS] ??
        event.type.replaceAll('_', ' '),
      subtitle: `${event.source} · ${event.actor_type}`,
      timestamp: event.created_at,
      href: event.correlation_id ? `/orchestrator/runs/${event.correlation_id}` : null,
    }));
}

export function mapEventsToNotifications(events: OrchestratorEvent[]): NotificationItem[] {
  return events
    .filter((event) => !NOISE_EVENT_TYPES.has(event.type) && isUnreadEvent(event))
    .slice(0, NOTIFICATION_LIMIT)
    .map((event) => ({
      id: event.id,
      title:
        RUN_EVENT_LABELS[event.type as keyof typeof RUN_EVENT_LABELS] ??
        event.type.replaceAll('_', ' '),
      body: `${event.source} · ${formatDateTime(event.created_at)}`,
      timestamp: event.created_at,
      unread: true,
      href: event.correlation_id ? `/orchestrator/runs/${event.correlation_id}` : null,
    }));
}

export function mapRunsToHistory(runs: OrchestratorRun[]): ExecutionHistoryItem[] {
  return runs.slice(0, HISTORY_LIMIT).map((run) => ({
    id: run.id,
    status: run.status,
    label: resolveRunLabel(run),
    mode: resolveRunMode(run),
    timestamp: run.created_at,
    duration: formatDuration(run.started_at, run.completed_at),
    href: `/orchestrator/runs/${run.id}`,
  }));
}

export function mapSnapshotToProfile(
  snapshot: Pick<
    CabinetRawSnapshot,
    'organization' | 'projectCount' | 'workspaceCount' | 'agentCount' | 'runs' | 'userEmail'
  >,
): ProfileSummaryData {
  return {
    email: snapshot.userEmail,
    organizationName: snapshot.organization?.name ?? '—',
    subscription: resolveSubscription(snapshot.organization?.settings ?? null),
    workspaceCount: snapshot.workspaceCount,
    projectCount: snapshot.projectCount,
    agentCount: snapshot.agentCount,
    executionCount: snapshot.runs.length,
    createdAt: snapshot.organization?.created_at ?? null,
  };
}

export function mapSnapshotToQuickActions(
  snapshot: Pick<
    CabinetRawSnapshot,
    'projectCount' | 'workspaceCount' | 'agentCount' | 'documentCount' | 'crmLeadCount' | 'runs'
  >,
): QuickActionWithCount[] {
  const osaRuns = snapshot.runs.filter(isOsaRun).length;
  const runningRuns = snapshot.runs.filter((run) => run.status === 'running' || run.status === 'pending').length;
  const completedRuns = snapshot.runs.filter((run) => run.status === 'completed').length;
  const counts: Record<string, number> = {
    continue_work: runningRuns,
    open_project: snapshot.projectCount,
    new_task: osaRuns,
    recent_results: completedRuns,
  };

  return CABINET_QUICK_ACTIONS.map((action) => ({
    ...action,
    count: counts[action.id] ?? 0,
  }));
}

export function mapSnapshotToModules(snapshot: CabinetRawSnapshot): ModuleWithCount[] {
  const osaRuns = snapshot.runs.filter(isOsaRun).length;
  const automationRuns = snapshot.runs.filter((run) => !isOsaRun(run)).length;
  const estateProjects = snapshot.projects.filter(
    (project) => project.project_type === 'estate',
  ).length;
  const mlmProjects = snapshot.projects.filter((project) => project.project_type === 'mlm').length;
  const financeProjects = snapshot.projects.filter(
    (project) => project.project_type === 'finance',
  ).length;

  const counts: Record<string, number> = {
    work: osaRuns,
    crm: snapshot.crmLeadCount,
    documents: snapshot.documentCount,
    marketing: snapshot.crmLeadCount,
    analytics: snapshot.runs.length,
    automation: automationRuns,
    knowledge: snapshot.knowledgeSourceCount,
    estate: estateProjects,
    mlm: mlmProjects,
    finance: financeProjects,
    projects: snapshot.projectCount,
  };

  const moduleIds = [
    'work',
    'projects',
    'documents',
    'knowledge',
    'automation',
    'marketing',
    'crm',
    'estate',
    'mlm',
    'finance',
  ] as const;

  return moduleIds.map((id) => {
    const existing = CABINET_MODULES.find((module) => module.id === id);

    return {
      id,
      label:
        id === 'projects'
          ? 'Projects'
          : (existing?.label ?? id.charAt(0).toUpperCase() + id.slice(1)),
      href: id === 'projects' ? '/projects' : (existing?.href ?? '/cabinet'),
      icon: existing?.icon ?? (id === 'projects' ? '📁' : '📦'),
      description:
        existing?.description ?? (id === 'projects' ? 'Active projects' : `${id} module`),
      pinned: existing?.pinned,
      count: counts[id] ?? 0,
    };
  });
}

export function mapSnapshotToWorkspace(
  snapshot: Pick<CabinetRawSnapshot, 'organization' | 'projects' | 'runs'>,
): WorkspaceCardData {
  const latestRun = snapshot.runs[0] ?? null;
  const latestProject = snapshot.projects[0] ?? null;
  const runningRun = snapshot.runs.find((run) => RUNNING_STATUSES.has(run.status)) ?? null;

  return {
    name: snapshot.organization?.name ?? 'Default workspace',
    status: runningRun ? 'Active execution' : latestProject ? 'Ready' : 'Idle',
    lastActive: latestProject?.updated_at ?? snapshot.organization?.created_at ?? null,
    lastExecution: latestRun ? formatDateTime(latestRun.created_at) : null,
    currentProject: latestProject?.name ?? null,
  };
}

export function mapHealthSnapshot(health: SystemHealthSnapshot) {
  return [
    { id: 'runtime', label: 'Runtime', status: health.runtime },
    { id: 'gateway', label: 'Gateway', status: health.gateway },
    { id: 'memory', label: 'Memory', status: health.memory },
    { id: 'knowledge', label: 'Knowledge', status: health.knowledge },
    { id: 'automation', label: 'Automation', status: health.automation },
    { id: 'database', label: 'Database', status: health.database },
  ];
}

export function formatExecutionTimeMs(value: number): string {
  if (value <= 0) {
    return '0s';
  }

  const seconds = Math.round(value / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

export function formatSuccessRate(value: number | null): string {
  if (value === null) {
    return '—';
  }

  return `${value}%`;
}

export function formatAverageRuntime(value: number | null): string {
  if (value === null) {
    return '—';
  }

  return formatExecutionTimeMs(value);
}

export function buildCabinetDashboardFromSnapshot(
  snapshot: CabinetRawSnapshot,
): CabinetDashboardData {
  return {
    overview: mapRunsToOverviewMetrics(snapshot.runs),
    activity: mapEventsToActivity(snapshot.events),
    usage: mapRunsToUsageStats(snapshot.runs),
    quickActions: mapSnapshotToQuickActions(snapshot),
    profile: mapSnapshotToProfile(snapshot),
    health: mapHealthSnapshot(snapshot.health),
    modules: mapSnapshotToModules(snapshot),
    workspace: mapSnapshotToWorkspace(snapshot),
    notifications: mapEventsToNotifications(snapshot.events),
    history: mapRunsToHistory(snapshot.runs),
  };
}

export function createEmptyCabinetDashboard(email: string): CabinetDashboardData {
  return buildCabinetDashboardFromSnapshot({
    runs: [],
    events: [],
    organization: null,
    projects: [],
    projectCount: 0,
    workspaceCount: 0,
    agentCount: 0,
    documentCount: 0,
    knowledgeSourceCount: 0,
    crmLeadCount: 0,
    memoryCount: 0,
    health: {
      database: 'unknown',
      gateway: 'unknown',
      runtime: 'unknown',
      memory: 'unknown',
      knowledge: 'unknown',
      automation: 'unknown',
    },
    userEmail: email,
  });
}
