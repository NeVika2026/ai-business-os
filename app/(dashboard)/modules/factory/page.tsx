import { FactoryBundleStudio } from '@/components/platform/FactoryBundleStudio';

type FactoryBundlePageProps = {
  searchParams: Promise<{ prompt?: string; project?: string }>;
};

export default async function FactoryBundlePage({ searchParams }: FactoryBundlePageProps) {
  const { prompt, project } = await searchParams;

  return (
    <FactoryBundleStudio
      initialPrompt={prompt?.trim() ?? ''}
      initialProjectId={project?.trim() || null}
    />
  );
}
