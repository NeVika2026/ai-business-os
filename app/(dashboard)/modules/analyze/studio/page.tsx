import { ResearchStudio } from '@/components/platform/ResearchStudio';

type AnalyzeStudioPageProps = {
  searchParams: Promise<{ prompt?: string; project?: string; artifact?: string }>;
};

export default async function AnalyzeStudioPage({ searchParams }: AnalyzeStudioPageProps) {
  const { prompt, project, artifact } = await searchParams;
  return <ResearchStudio mode="analyze" initialQuery={prompt?.trim() || ''} initialProjectId={project?.trim() || null} initialArtifactId={artifact?.trim() || null} />;
}
