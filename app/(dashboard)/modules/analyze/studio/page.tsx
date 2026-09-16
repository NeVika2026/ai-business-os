import { ResearchStudio } from '@/components/platform/ResearchStudio';

type AnalyzeStudioPageProps = {
  searchParams: Promise<{ prompt?: string; project?: string }>;
};

export default async function AnalyzeStudioPage({ searchParams }: AnalyzeStudioPageProps) {
  const { prompt, project } = await searchParams;
  return <ResearchStudio mode="analyze" initialQuery={prompt?.trim() || ''} initialProjectId={project?.trim() || null} />;
}
