import { CreateStudio } from '@/components/platform/CreateStudio';
import {
  getCreateStudioMode,
  type CreateStudioModeId,
} from '@/utils/platform/create-studio';

type CreateStudioPageProps = {
  searchParams: Promise<{ mode?: string; project?: string }>;
};

export default async function CreateStudioPage({ searchParams }: CreateStudioPageProps) {
  const { mode, project } = await searchParams;
  const initialModeId = getCreateStudioMode(
    (mode ?? 'video') as CreateStudioModeId,
  ).id;

  return (
    <CreateStudio
      initialModeId={initialModeId}
      initialProjectId={project?.trim() || null}
    />
  );
}
