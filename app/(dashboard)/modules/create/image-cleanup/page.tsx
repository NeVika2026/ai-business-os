import { ImageCleanupStudio } from '@/components/platform/ImageCleanupStudio';

type PageProps = {
  searchParams: Promise<{ mode?: string; project?: string }>;
};

export default async function ImageCleanupPage({ searchParams }: PageProps) {
  const { mode, project } = await searchParams;
  const initialMode = mode === 'object-remove' ? 'object-remove' : 'remove-bg';

  return (
    <ImageCleanupStudio
      initialMode={initialMode}
      projectId={project?.trim() || null}
    />
  );
}
