import { CommunicationsStudio } from '@/components/platform/CommunicationsStudio';

type CommunicationsPageProps = {
  searchParams: Promise<{ project?: string }>;
};

export default async function CommunicationsPage({
  searchParams,
}: CommunicationsPageProps) {
  const { project } = await searchParams;
  return <CommunicationsStudio projectId={project?.trim() || null} />;
}
