import { FactoryBundleStudio } from '@/components/platform/FactoryBundleStudio';

type FactoryBundlePageProps = {
  searchParams: Promise<{ prompt?: string }>;
};

export default async function FactoryBundlePage({ searchParams }: FactoryBundlePageProps) {
  const { prompt } = await searchParams;

  return <FactoryBundleStudio initialPrompt={prompt?.trim() ?? ''} />;
}
