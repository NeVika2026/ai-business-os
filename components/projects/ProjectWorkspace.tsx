import { ProjectActivity } from '@/components/projects/ProjectActivity';
import { ProjectCommandCenter } from '@/components/projects/ProjectCommandCenter';
import { ProjectDeliveryPanel } from '@/components/projects/ProjectDeliveryPanel';
import { ProjectDocuments } from '@/components/projects/ProjectDocuments';
import { ProjectExecutions } from '@/components/projects/ProjectExecutions';
import { ProjectFactoryHistory } from '@/components/projects/ProjectFactoryHistory';
import { ProjectGoals } from '@/components/projects/ProjectGoals';
import { ProjectKnowledge } from '@/components/projects/ProjectKnowledge';
import { ProjectMedia } from '@/components/projects/ProjectMedia';
import { ProjectMembers } from '@/components/projects/ProjectMembers';
import { ProjectMemoryPanel } from '@/components/projects/ProjectMemoryPanel';
import { ProjectModules } from '@/components/projects/ProjectModules';
import { ProjectTimeline } from '@/components/projects/ProjectTimeline';
import type { FactoryArtifact } from '@/lib/factory-chain/persistence';
import type { ProjectMemory } from '@/lib/projects/project-memory';
import type { ProjectMediaItem } from '@/utils/projects/project-media-loader';
import type { ProjectWorkspaceData } from '@/utils/projects/project-types';

type ProjectWorkspaceProps = {
  workspace: ProjectWorkspaceData;
  media: ProjectMediaItem[];
  factoryArtifacts: FactoryArtifact[];
  projectMemory: ProjectMemory;
};

export function ProjectWorkspace({
  workspace,
  media,
  factoryArtifacts,
  projectMemory,
}: ProjectWorkspaceProps) {
  return (
    <div className="space-y-6">
      <ProjectCommandCenter
        workspace={workspace}
        media={media}
        artifacts={factoryArtifacts}
      />

      <ProjectDeliveryPanel
        projectId={workspace.project.id}
        artifacts={factoryArtifacts}
        media={media}
      />

      <ProjectMemoryPanel
        projectId={workspace.project.id}
        initialMemory={projectMemory}
      />

      <ProjectFactoryHistory
        projectId={workspace.project.id}
        artifacts={factoryArtifacts}
      />

      <ProjectModules modules={workspace.modules} />

      <ProjectMedia projectId={workspace.project.id} media={media} />

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
