import type { NavigatorStepId } from '@/types/navigator';

export const PROJECT_RUNTIME_STATUSES = ['planning', 'active', 'paused', 'completed'] as const;

export type ProjectRuntimeStatus = (typeof PROJECT_RUNTIME_STATUSES)[number];

export type ProjectNavigatorState = {
  selectedStepId: NavigatorStepId | null;
  lastSuggestedStepId: NavigatorStepId | null;
  updatedAt: string;
};

export type ProjectRuntime = {
  id: string;
  title: string;
  description: string;
  status: ProjectRuntimeStatus;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  summary: string;
  mission: string;
  lastActivity: string | null;
  nextStep: string;
  memorySummary: string;
  navigatorState: ProjectNavigatorState;
  organizationId: string;
  userId: string | null;
  sourceProjectId: string | null;
};

export type CreateProjectRuntimeInput = {
  title: string;
  description?: string;
  status?: ProjectRuntimeStatus;
  mission?: string;
  summary?: string;
  nextStep?: string;
  organizationId: string;
  userId?: string | null;
  sourceProjectId?: string | null;
  id?: string;
};

export type UpdateProjectRuntimeInput = {
  title?: string;
  description?: string;
  status?: ProjectRuntimeStatus;
  summary?: string;
  mission?: string;
  lastActivity?: string | null;
  nextStep?: string;
  memorySummary?: string;
  navigatorState?: Partial<ProjectNavigatorState>;
};

export type ProjectRuntimeScope = {
  organizationId: string;
  userId?: string | null;
};

export type ProjectTodayBriefing = {
  activeProjectTitle: string;
  headline: string;
  lastResult: string | null;
  nextStep: string;
  progressPercent: number;
  isDefaultWorkspace: boolean;
  projectRuntimeId: string;
};
