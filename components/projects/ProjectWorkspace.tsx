import { ProjectActivity } from '@/components/projects/ProjectActivity';
import { ProjectDocuments } from '@/components/projects/ProjectDocuments';
import { ProjectExecutions } from '@/components/projects/ProjectExecutions';
import { ProjectGoals } from '@/components/projects/ProjectGoals';
import { ProjectHeader } from '@/components/projects/ProjectHeader';
import { ProjectKnowledge } from '@/components/projects/ProjectKnowledge';
import { ProjectMembers } from '@/components/projects/ProjectMembers';
import { ProjectModules } from '@/components/projects/ProjectModules';
import { ProjectOverview } from '@/components/projects/ProjectOverview';
import { ProjectQuickActions } from '@/components/projects/ProjectQuickActions';
import { ProjectTimeline } from '@/components/projects/ProjectTimeline';
import type { ProjectWorkspaceData } from '@/utils/projects/project-types';

type ProjectWorkspaceProps = {
  workspace: ProjectWorkspaceData;
};

export function ProjectWorkspace({ workspace }: ProjectWorkspaceProps) {
  return (
    <div className="space-y-6">
      <ProjectHeader project={workspace.project} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ProjectOverview overview={workspace.overview} />
        <ProjectQuickActions actions={workspace.quickActions} />
      </div>

      <ProjectModules modules={workspace.modules} />

      <div className="grid gap-6 xl:grid-cols-2">
        <ProjectExecutions executions={workspace.executions} />
        <ProjectActivity activity={workspace.activity} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ProjectDocuments
          documents={workspace.documents}
          totalCount={workspace.knowledge.documentCount}
          projectId={workspace.project.id}
        />
        <ProjectKnowledge knowledge={workspace.knowledge} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ProjectGoals goals={workspace.goals} />
        <ProjectMembers members={workspace.members} />
      </div>

      <ProjectTimeline timeline={workspace.timeline} />
    </div>
  );
}
