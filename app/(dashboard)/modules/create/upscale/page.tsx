import { UpscaleStudio } from '@/components/platform/UpscaleStudio';

type Props = {
  searchParams: Promise<{ kind?: string; project?: string }>;
};

export default async function UpscalePage({ searchParams }: Props) {
  const { kind, project } = await searchParams;
  return (
    <UpscaleStudio
      initialKind={kind === 'video' ? 'video' : 'image'}
      projectId={project?.trim() || null}
    />
  );
}
