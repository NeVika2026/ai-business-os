import type { NextBestStepContent } from '@/types/navigator';
import type { ProjectRuntimeScope } from '@/types/project-runtime';

export type WorkspaceTimelineEntry = {
  id: string;
  task: string;
  result: string;
  decision: string;
  occurredAt: string;
};

export type OsaWorkspacePageData = {
  projectId: string;
  header: {
    title: string;
    description: string;
    status: string;
    lastActivity: string | null;
  };
  today: {
    headline: string;
    mission: string;
    nextStep: string;
    priority: string;
    progressPercent: number;
    lastResult: string | null;
  };
  navigator: NextBestStepContent;
  timeline: WorkspaceTimelineEntry[];
  scope: ProjectRuntimeScope;
};
