import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import { isOsaRun } from '@/utils/osa/osa-runs';
import { formatDateTime, formatDuration } from '@/utils/orchestrator/runs';

import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPES,
  type Project,
  type ProjectActivityItem,
  type ProjectDocument,
  type ProjectExecution,
  type ProjectKnowledgeSummary,
  type ProjectListData,
  type ProjectListItem,
  type ProjectListSnapshotRow,
  type ProjectMember,
  type ProjectModule,
  type ProjectOverview,
  type ProjectQuickAction,
  type ProjectRawRow,
  type ProjectRawSnapshot,
  type ProjectStatus,
  type ProjectTimelineEntry,
  type ProjectType,
  type ProjectWorkspaceData,
} from '@/utils/projects/project-types';

const PROGRESS_EVENT_TYPES = new Set(['osa_progress_updated']);

export function slugifyProjectName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseProjectType(value: string): ProjectType {
  const normalized = value.trim().toLowerCase();

  if ((PROJECT_TYPES as readonly string[]).includes(normalized)) {
    return normalized as ProjectType;
  }

  return 'general';
}

export function parseProjectStatus(value: string): ProjectStatus {
  const normalized = value.trim().toLowerCase();

  if ((PROJECT_STATUSES as readonly string[]).includes(normalized)) {
    return normalized as ProjectStatus;
  }

  if (normalized === 'archived') {
    return 'archived';
  }

  return 'active';
}

export function mapProjectRow(row: ProjectRawRow): Project {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: slugifyProjectName(row.name),
    description: row.description,
    type: parseProjectType(row.project_type),
    status: parseProjectStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerId: row.created_by,
    color: row.color,
    icon: row.icon,
    favorite: false,
    tags: [],
  };
}

export function extractProjectGoals(description: string | null): string[] {
  if (!description) {
    return [];
  }

  return description
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- ') || line.startsWith('* '))
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter((line) => line.length > 0);
}

export function runBelongsToProject(
  run: OrchestratorRun,
  projectId: string,
  employeeIds: string[],
  taskIds: string[],
): boolean {
  if (employeeIds.includes(run.ai_employee_id)) {
    return true;
  }

  const inputProjectId = run.input.project_id ?? run.input.projectId;

  if (typeof inputProjectId === 'string' && inputProjectId === projectId) {
    return true;
  }

  const taskId = run.input.task_id ?? run.input.taskId;

  if (typeof taskId === 'string' && taskIds.includes(taskId)) {
    return true;
  }

  return false;
}

export function filterProjectRuns(
  runs: OrchestratorRun[],
  projectId: string,
  employeeIds: string[],
  taskIds: string[],
): OrchestratorRun[] {
  return runs.filter((run) => runBelongsToProject(run, projectId, employeeIds, taskIds));
}

export function filterProjectOsaRuns(
  runs: OrchestratorRun[],
  projectId: string,
  employeeIds: string[],
  taskIds: string[],
): OrchestratorRun[] {
  return filterProjectRuns(runs, projectId, employeeIds, taskIds).filter(isOsaRun);
}

function formatEventTitle(event: OrchestratorEvent): string {
  const payloadTitle =
    event.payload && typeof event.payload.title === 'string' ? event.payload.title : null;

  if (payloadTitle) {
    return payloadTitle;
  }

  return event.type.replace(/_/g, ' ');
}

export function classifyProjectActivityCategory(event: OrchestratorEvent): string {
  if (event.source === 'osa' || event.type.startsWith('osa_')) {
    return 'OSA';
  }

  if (event.source === 'knowledge' || event.type.includes('knowledge')) {
    return 'Documents';
  }

  if (event.source === 'crm' || event.type.includes('lead')) {
    return 'CRM';
  }

  if (event.source === 'orchestrator' || event.type.includes('run_')) {
    return 'Automation';
  }

  return 'Projects';
}

export function mapEventsToProjectActivity(
  events: OrchestratorEvent[],
  runIds: Set<string>,
  limit = 15,
): ProjectActivityItem[] {
  return events
    .filter((event) => !PROGRESS_EVENT_TYPES.has(event.type))
    .filter(
      (event) =>
        (event.correlation_id && runIds.has(event.correlation_id)) ||
        event.type.includes('project') ||
        event.type.includes('knowledge') ||
        event.type.includes('lead'),
    )
    .slice(0, limit)
    .map((event) => ({
      id: event.id,
      title: formatEventTitle(event),
      category: classifyProjectActivityCategory(event),
      timestamp: event.created_at,
    }));
}

export function mapRunToExecution(run: OrchestratorRun): ProjectExecution {
  const label =
    typeof run.input.user_prompt === 'string' && run.input.user_prompt.trim().length > 0
      ? run.input.user_prompt.trim()
      : (run.employee?.name ?? 'OSA run');

  return {
    id: run.id,
    label,
    status: run.status,
    duration: formatDuration(run.started_at, run.completed_at),
    startedAt: run.started_at,
    finishedAt: run.completed_at,
    href: `/orchestrator/runs/${run.id}`,
  };
}

export function mapRunsToExecutions(runs: OrchestratorRun[], limit = 10): ProjectExecution[] {
  return runs.slice(0, limit).map(mapRunToExecution);
}

export function computeProjectProgress(runs: OrchestratorRun[]): number {
  if (runs.length === 0) {
    return 0;
  }

  const completed = runs.filter((run) => run.status === 'completed').length;

  return Math.round((completed / runs.length) * 100);
}

export function mapSnapshotToOverview(
  snapshot: ProjectRawSnapshot,
  projectRuns: OrchestratorRun[],
  activity: ProjectActivityItem[],
): ProjectOverview {
  const osaRuns = filterProjectOsaRuns(
    snapshot.runs,
    snapshot.project.id,
    snapshot.employeeIds,
    snapshot.taskIds,
  );
  const goals = extractProjectGoals(snapshot.project.description);
  const latestExecution = osaRuns[0] ? mapRunToExecution(osaRuns[0]) : null;

  return {
    description: snapshot.project.description,
    goals,
    progressPercent: computeProjectProgress(projectRuns),
    latestExecution,
    latestActivity: activity[0] ?? null,
    createdAt: snapshot.project.created_at,
    updatedAt: snapshot.project.updated_at,
  };
}

function latestTimestamp(values: (string | null | undefined)[]): string | null {
  const timestamps = values.filter((value): value is string => Boolean(value));

  if (timestamps.length === 0) {
    return null;
  }

  return timestamps.sort((left, right) => right.localeCompare(left))[0] ?? null;
}

export function mapSnapshotToModules(
  snapshot: ProjectRawSnapshot,
  projectRuns: OrchestratorRun[],
): ProjectModule[] {
  const projectId = snapshot.project.id;
  const osaRuns = filterProjectOsaRuns(
    snapshot.runs,
    projectId,
    snapshot.employeeIds,
    snapshot.taskIds,
  );
  const documentCount = snapshot.knowledgeItems.length;
  const knowledgeCount = snapshot.knowledgeSources.length;

  const modules: ProjectModule[] = [
    {
      id: 'osa',
      label: 'OSA',
      href: `/osa?project=${projectId}`,
      icon: '✨',
      enabled: osaRuns.length > 0 || snapshot.agentCount > 0,
      count: osaRuns.length,
      latestActivity: osaRuns[0]?.created_at ?? null,
    },
    {
      id: 'documents',
      label: 'Documents',
      href: `/knowledge?project=${projectId}`,
      icon: '📄',
      enabled: documentCount > 0,
      count: documentCount,
      latestActivity: snapshot.knowledgeItems[0]?.created_at ?? null,
    },
    {
      id: 'knowledge',
      label: 'Knowledge',
      href: `/knowledge?project=${projectId}`,
      icon: '📚',
      enabled: knowledgeCount > 0,
      count: knowledgeCount,
      latestActivity: snapshot.knowledgeSources[0]?.updated_at ?? null,
    },
    {
      id: 'crm',
      label: 'CRM',
      href: `/crm?project=${projectId}`,
      icon: '👥',
      enabled: snapshot.crmLeadCount > 0,
      count: snapshot.crmLeadCount,
      latestActivity: null,
    },
    {
      id: 'automation',
      label: 'Automation',
      href: `/orchestrator?project=${projectId}`,
      icon: '⚙️',
      enabled: projectRuns.length > 0,
      count: projectRuns.length,
      latestActivity: projectRuns[0]?.created_at ?? null,
    },
    {
      id: 'marketing',
      label: 'Marketing',
      href: `/projects/${projectId}`,
      icon: '📣',
      enabled: snapshot.project.project_type === 'marketing',
      count: snapshot.project.project_type === 'marketing' ? 1 : 0,
      latestActivity: null,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: `/projects/${projectId}`,
      icon: '📊',
      enabled: projectRuns.length > 0,
      count: projectRuns.filter((run) => run.status === 'completed').length,
      latestActivity: projectRuns.find((run) => run.status === 'completed')?.completed_at ?? null,
    },
    {
      id: 'finance',
      label: 'Finance',
      href: `/projects/${projectId}`,
      icon: '💰',
      enabled: snapshot.project.project_type === 'finance',
      count: snapshot.project.project_type === 'finance' ? 1 : 0,
      latestActivity: null,
    },
    {
      id: 'estate',
      label: 'Estate',
      href: `/projects/${projectId}`,
      icon: '🏠',
      enabled: snapshot.project.project_type === 'estate',
      count: snapshot.project.project_type === 'estate' ? 1 : 0,
      latestActivity: null,
    },
    {
      id: 'mlm',
      label: 'MLM',
      href: `/projects/${projectId}`,
      icon: '🔗',
      enabled: snapshot.project.project_type === 'mlm',
      count: snapshot.project.project_type === 'mlm' ? 1 : 0,
      latestActivity: null,
    },
  ];

  return modules;
}

export function mapSnapshotToKnowledge(snapshot: ProjectRawSnapshot): ProjectKnowledgeSummary {
  const itemsBySource = snapshot.knowledgeItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.source_id] = (acc[item.source_id] ?? 0) + 1;
    return acc;
  }, {});

  return {
    bases: snapshot.knowledgeSources.map((source) => ({
      id: source.id,
      name: source.name,
      type: source.source_type,
      status: source.status,
      itemCount: itemsBySource[source.id] ?? 0,
      href: `/knowledge/sources/${source.id}`,
    })),
    documentCount: snapshot.knowledgeItems.length,
    memoryCount: snapshot.memoryCount,
  };
}

export function mapSnapshotToDocuments(snapshot: ProjectRawSnapshot): ProjectDocument[] {
  return snapshot.knowledgeItems.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.title,
    type: item.item_type,
    status: item.status,
    createdAt: item.created_at,
    href: `/knowledge/sources/${item.source_id}`,
  }));
}

export function mapSnapshotToTimeline(
  snapshot: ProjectRawSnapshot,
  projectRuns: OrchestratorRun[],
): ProjectTimelineEntry[] {
  const entries: ProjectTimelineEntry[] = [
    {
      id: `project-${snapshot.project.id}`,
      kind: 'project',
      title: 'Project created',
      timestamp: snapshot.project.created_at,
      href: `/projects/${snapshot.project.id}`,
    },
  ];

  for (const run of projectRuns.slice(0, 5)) {
    entries.push({
      id: `execution-${run.id}`,
      kind: 'execution',
      title: `Execution ${run.status}`,
      timestamp: run.created_at,
      href: `/orchestrator/runs/${run.id}`,
    });
  }

  for (const item of snapshot.knowledgeItems.slice(0, 5)) {
    entries.push({
      id: `document-${item.id}`,
      kind: 'document',
      title: item.title,
      timestamp: item.created_at,
      href: `/knowledge/sources/${item.source_id}`,
    });
  }

  for (const source of snapshot.knowledgeSources.slice(0, 3)) {
    entries.push({
      id: `knowledge-${source.id}`,
      kind: 'knowledge',
      title: source.name,
      timestamp: source.created_at,
      href: `/knowledge/sources/${source.id}`,
    });
  }

  for (const run of projectRuns.filter((entry) => !isOsaRun(entry)).slice(0, 3)) {
    entries.push({
      id: `automation-${run.id}`,
      kind: 'automation',
      title: `Automation ${run.status}`,
      timestamp: run.created_at,
      href: `/orchestrator/runs/${run.id}`,
    });
  }

  return entries.sort((left, right) => right.timestamp.localeCompare(left.timestamp)).slice(0, 20);
}

export function mapSnapshotToQuickActions(projectId: string): ProjectQuickAction[] {
  return [
    {
      id: 'run_osa',
      label: 'Run OSA',
      href: `/osa?project=${projectId}`,
      icon: '✨',
      enabled: true,
    },
    {
      id: 'upload_document',
      label: 'Upload document',
      href: `/knowledge?project=${projectId}`,
      icon: '📄',
      enabled: true,
    },
    {
      id: 'open_crm',
      label: 'Open CRM',
      href: `/crm?project=${projectId}`,
      icon: '👥',
      enabled: true,
    },
    {
      id: 'open_knowledge',
      label: 'Open Knowledge',
      href: `/knowledge?project=${projectId}`,
      icon: '📚',
      enabled: true,
    },
    {
      id: 'create_automation',
      label: 'Create automation',
      href: `/orchestrator?project=${projectId}`,
      icon: '⚙️',
      enabled: true,
    },
  ];
}

function normalizeMemberProfile(
  profile: ProjectRawSnapshot['members'][number]['profile'],
): { full_name: string | null } | null {
  if (Array.isArray(profile)) {
    return profile[0] ?? null;
  }

  return profile;
}

export function mapSnapshotToMembers(snapshot: ProjectRawSnapshot): ProjectMember[] {
  return snapshot.members.map((member) => {
    const profile = normalizeMemberProfile(member.profile);

    return {
      id: member.user_id,
      name: profile?.full_name?.trim() || 'Team member',
      role: member.role,
      isOwner: member.user_id === snapshot.project.created_by,
    };
  });
}

export function buildProjectWorkspaceFromSnapshot(
  snapshot: ProjectRawSnapshot,
): ProjectWorkspaceData {
  const project = mapProjectRow(snapshot.project);
  const projectRuns = filterProjectRuns(
    snapshot.runs,
    snapshot.project.id,
    snapshot.employeeIds,
    snapshot.taskIds,
  );
  const osaRuns = filterProjectOsaRuns(
    snapshot.runs,
    snapshot.project.id,
    snapshot.employeeIds,
    snapshot.taskIds,
  );
  const runIds = new Set(projectRuns.map((run) => run.id));
  const activity = mapEventsToProjectActivity(snapshot.events, runIds);
  const overview = mapSnapshotToOverview(snapshot, projectRuns, activity);
  const modules = mapSnapshotToModules(snapshot, projectRuns);
  const goals = extractProjectGoals(snapshot.project.description);

  return {
    project,
    overview,
    modules,
    executions: mapRunsToExecutions(osaRuns),
    knowledge: mapSnapshotToKnowledge(snapshot),
    documents: mapSnapshotToDocuments(snapshot),
    timeline: mapSnapshotToTimeline(snapshot, projectRuns),
    quickActions: mapSnapshotToQuickActions(project.id),
    activity,
    goals,
    members: mapSnapshotToMembers(snapshot),
  };
}

export function mapListRowsToProjects(
  rows: ProjectListSnapshotRow[],
  runCounts: Record<string, number>,
  documentCounts: Record<string, number>,
): ProjectListItem[] {
  return rows.map((row) => {
    const project = mapProjectRow(row);
    const executionCount = runCounts[row.id] ?? 0;
    const documentCount = documentCounts[row.id] ?? 0;
    const moduleCount =
      (executionCount > 0 ? 1 : 0) +
      (documentCount > 0 ? 1 : 0) +
      (project.type !== 'general' ? 1 : 0);

    return {
      ...project,
      executionCount,
      documentCount,
      moduleCount: Math.max(moduleCount, 1),
    };
  });
}

export function buildProjectListData(
  rows: ProjectListSnapshotRow[],
  runCounts: Record<string, number>,
  documentCounts: Record<string, number>,
): ProjectListData {
  const projects = mapListRowsToProjects(rows, runCounts, documentCounts);

  return {
    projects,
    totalCount: projects.length,
  };
}

export function createEmptyProjectList(): ProjectListData {
  return {
    projects: [],
    totalCount: 0,
  };
}

export function formatProjectDate(value: string) {
  return formatDateTime(value);
}

export function getProjectTypeLabel(type: ProjectType) {
  return PROJECT_TYPE_LABELS[type];
}

export function getProjectStatusLabel(status: ProjectStatus) {
  return PROJECT_STATUS_LABELS[status];
}

export function countEnabledModules(modules: ProjectModule[]): number {
  return modules.filter((module) => module.enabled).length;
}

export function latestModuleActivity(modules: ProjectModule[]): string | null {
  return latestTimestamp(modules.map((module) => module.latestActivity));
}
