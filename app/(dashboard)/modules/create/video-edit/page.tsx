import { VideoEditStudio } from '@/components/platform/VideoEditStudio';

type Props = {
  searchParams: Promise<{ mode?: string; project?: string; source?: string }>;
};

export default async function VideoEditPage({ searchParams }: Props) {
  const { mode, project, source } = await searchParams;
  return (
    <VideoEditStudio
      initialMode={mode === 'expand' ? 'expand' : 'edit'}
      projectId={project?.trim() || null}
      initialSourceUrl={source?.trim() || ''}
    />
  );
}
