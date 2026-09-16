import { CreateStudio } from '@/components/platform/CreateStudio';
import {
  getCreateStudioMode,
  type CreateStudioModeId,
} from '@/utils/platform/create-studio';

type CreateStudioPageProps = {
  searchParams: Promise<{
    mode?: string;
    project?: string;
    artifact?: string;
    goal?: string;
    audience?: string;
    format?: string;
    context?: string;
  }>;
};

export default async function CreateStudioPage({ searchParams }: CreateStudioPageProps) {
  const { mode, project, artifact, goal, audience, format, context } = await searchParams;
  const initialModeId = getCreateStudioMode(
    (mode ?? 'video') as CreateStudioModeId,
  ).id;

  return (
    <CreateStudio
      initialModeId={initialModeId}
      initialProjectId={project?.trim() || null}
      initialArtifactId={artifact?.trim() || null}
      initialGoal={goal?.trim() || ''}
      initialAudience={audience?.trim() || ''}
      initialFormat={format?.trim() || ''}
      initialContext={context?.trim() || ''}
    />
  );
}
