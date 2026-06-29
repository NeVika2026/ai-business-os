export const PROJECT_TYPES = [
  'general',
  'estate',
  'mlm',
  'marketing',
  'crm',
  'automation',
  'knowledge',
  'finance',
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_STATUSES = ['planning', 'active', 'paused', 'completed', 'archived'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  general: 'General',
  estate: 'Estate',
  mlm: 'MLM',
  marketing: 'Marketing',
  crm: 'CRM',
  automation: 'Automation',
  knowledge: 'Knowledge',
  finance: 'Finance',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

export type Project = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  type: ProjectType;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  color: string | null;
  icon: string | null;
  favorite: boolean;
  tags: string[];
};

export type ProjectModuleId =
  | 'osa'
  | 'documents'
  | 'knowledge'
  | 'crm'
  | 'automation'
  | 'marketing'
  | 'analytics'
  | 'finance'
  | 'estate'
  | 'mlm';

export type ProjectModule = {
  id: ProjectModuleId;
  label: string;
  href: string;
  icon: string;
  enabled: boolean;
  count: number;
  latestActivity: string | null;
};

export type ProjectExecution = {
  id: string;
  label: string;
  status: string;
  duration: string;
  startedAt: string | null;
  finishedAt: string | null;
  href: string;
};

export type ProjectDocument = {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  href: string;
};

export type ProjectKnowledgeBase = {
  id: string;
  name: string;
  type: string;
  status: string;
  itemCount: number;
  href: string;
};

export type ProjectKnowledgeSummary = {
  bases: ProjectKnowledgeBase[];
  documentCount: number;
  memoryCount: number;
};

export type ProjectTimelineEntry = {
  id: string;
  kind: 'project' | 'execution' | 'document' | 'knowledge' | 'automation';
  title: string;
  timestamp: string;
  href: string | null;
};

export type ProjectQuickAction = {
  id: string;
  label: string;
  href: string;
  icon: string;
  enabled: boolean;
};

export type ProjectActivityItem = {
  id: string;
  title: string;
  category: string;
  timestamp: string;
};

export type ProjectMember = {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
};

export type ProjectOverview = {
  description: string | null;
  goals: string[];
  progressPercent: number;
  latestExecution: ProjectExecution | null;
  latestActivity: ProjectActivityItem | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectListItem = Project & {
  executionCount: number;
  documentCount: number;
  moduleCount: number;
};

export type ProjectListData = {
  projects: ProjectListItem[];
  totalCount: number;
};

export type ProjectWorkspaceData = {
  project: Project;
  overview: ProjectOverview;
  modules: ProjectModule[];
  executions: ProjectExecution[];
  knowledge: ProjectKnowledgeSummary;
  documents: ProjectDocument[];
  timeline: ProjectTimelineEntry[];
  quickActions: ProjectQuickAction[];
  activity: ProjectActivityItem[];
  goals: string[];
  members: ProjectMember[];
};

export type ProjectRawRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  project_type: string;
  status: string;
  icon: string | null;
  color: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectKnowledgeSourceRow = {
  id: string;
  name: string;
  source_type: string;
  status: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectKnowledgeItemRow = {
  id: string;
  title: string;
  item_type: string;
  status: string;
  project_id: string | null;
  source_id: string;
  created_at: string;
};

export type ProjectMemberRow = {
  user_id: string;
  role: string;
  profile: { full_name: string | null } | { full_name: string | null }[] | null;
};

export type ProjectRawSnapshot = {
  project: ProjectRawRow;
  employeeIds: string[];
  taskIds: string[];
  runs: import('@/types/orchestrator').OrchestratorRun[];
  events: import('@/types/orchestrator').OrchestratorEvent[];
  knowledgeSources: ProjectKnowledgeSourceRow[];
  knowledgeItems: ProjectKnowledgeItemRow[];
  crmLeadCount: number;
  memoryCount: number;
  agentCount: number;
  members: ProjectMemberRow[];
};

export type ProjectListSnapshotRow = ProjectRawRow;
