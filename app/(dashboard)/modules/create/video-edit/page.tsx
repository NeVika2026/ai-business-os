import { VideoEditStudio } from '@/components/platform/VideoEditStudio';

type Props = {
  searchParams: Promise<{ mode?: string; project?: string }>;
};

export default async function VideoEditPage({ searchParams }: Props) {
  const { mode, project } = await searchParams;
  return (
    <VideoEditStudio
      initialMode={mode === 'expand' ? 'expand' : 'edit'}
      projectId={project?.trim() || null}
    />
  );
}
