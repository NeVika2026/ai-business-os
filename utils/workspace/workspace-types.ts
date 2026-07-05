import type { NextBestStepContent } from '@/types/navigator';
import type { AiOrchestraState } from '@/types/ai-orchestra';
import type { ProjectLifecycleSnapshot } from '@/types/project-lifecycle';
import type { ProjectRuntimeScope } from '@/types/project-runtime';

import type { ProjectReplay } from './project-replay';

export type WorkspaceTimelineEntry = {
  id: string;
  task: string;
  result: string;
  decision: string;
  occurredAt: string;
};

export type OsaWorkspacePageData = {
  projectId: string;
  userName: string | null;
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
  lifecycle: ProjectLifecycleSnapshot | null;
  orchestra: AiOrchestraState | null;
  replay: ProjectReplay;
  scope: ProjectRuntimeScope;
};
