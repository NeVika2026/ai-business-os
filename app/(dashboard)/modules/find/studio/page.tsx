import { ResearchStudio } from '@/components/platform/ResearchStudio';

type FindStudioPageProps = {
  searchParams: Promise<{ prompt?: string; project?: string }>;
};

export default async function FindStudioPage({ searchParams }: FindStudioPageProps) {
  const { prompt, project } = await searchParams;
  return <ResearchStudio mode="find" initialQuery={prompt?.trim() || ''} initialProjectId={project?.trim() || null} />;
}
