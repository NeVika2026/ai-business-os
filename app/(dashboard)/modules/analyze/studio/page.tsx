import { ResearchStudio } from '@/components/platform/ResearchStudio';

type AnalyzeStudioPageProps = {
  searchParams: Promise<{ prompt?: string }>;
};

export default async function AnalyzeStudioPage({ searchParams }: AnalyzeStudioPageProps) {
  const { prompt } = await searchParams;
  return <ResearchStudio mode="analyze" initialQuery={prompt?.trim() || ''} />;
}
