import { UpscaleStudio } from '@/components/platform/UpscaleStudio';

type Props = {
  searchParams: Promise<{ kind?: string; project?: string; source?: string }>;
};

export default async function UpscalePage({ searchParams }: Props) {
  const { kind, project, source } = await searchParams;
  return (
    <UpscaleStudio
      initialKind={kind === 'video' ? 'video' : 'image'}
      projectId={project?.trim() || null}
      initialSourceUrl={source?.trim() || ''}
    />
  );
}
