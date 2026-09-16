import { PublishStudio } from '@/components/platform/PublishStudio';

type PublishStudioPageProps = {
  searchParams: Promise<{ project?: string }>;
};

export default async function PublishStudioPage({ searchParams }: PublishStudioPageProps) {
  const { project } = await searchParams;
  return <PublishStudio initialProjectId={project?.trim() || null} />;
}
