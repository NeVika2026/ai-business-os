import { ResearchStudio } from '@/components/platform/ResearchStudio';

type FindStudioPageProps = {
  searchParams: Promise<{ prompt?: string }>;
};

export default async function FindStudioPage({ searchParams }: FindStudioPageProps) {
  const { prompt } = await searchParams;
  return <ResearchStudio mode="find" initialQuery={prompt?.trim() || ''} />;
}
