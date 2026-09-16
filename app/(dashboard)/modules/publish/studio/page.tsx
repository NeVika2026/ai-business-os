import { PublishStudio } from '@/components/platform/PublishStudio';

type PublishStudioPageProps = {
  searchParams: Promise<{ project?: string; artifact?: string }>;
};

export default async function PublishStudioPage({ searchParams }: PublishStudioPageProps) {
  const { project, artifact } = await searchParams;
  return <PublishStudio initialProjectId={project?.trim() || null} initialArtifactId={artifact?.trim() || null} />;
}
