import { VideoMotionStudio } from '@/components/platform/VideoMotionStudio';

type Props = {
  searchParams: Promise<{ mode?: string; project?: string }>;
};

export default async function VideoMotionPage({ searchParams }: Props) {
  const { mode, project } = await searchParams;
  return (
    <VideoMotionStudio
      initialMode={mode === 'motion' ? 'motion' : 'extend'}
      projectId={project?.trim() || null}
    />
  );
}
