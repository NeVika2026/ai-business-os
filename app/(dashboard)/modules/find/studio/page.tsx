import { ResearchStudio } from '@/components/platform/ResearchStudio';

type FindStudioPageProps = {
  searchParams: Promise<{ prompt?: string; project?: string; artifact?: string }>;
};

export default async function FindStudioPage({ searchParams }: FindStudioPageProps) {
  const { prompt, project, artifact } = await searchParams;
  return <ResearchStudio mode="find" initialQuery={prompt?.trim() || ''} initialProjectId={project?.trim() || null} initialArtifactId={artifact?.trim() || null} />;
}
