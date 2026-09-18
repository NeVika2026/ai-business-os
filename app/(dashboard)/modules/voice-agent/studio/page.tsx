import { VoiceAgentStudio } from '@/components/platform/VoiceAgentStudio';

type VoiceAgentPageProps = {
  searchParams: Promise<{ project?: string }>;
};

export default async function VoiceAgentPage({ searchParams }: VoiceAgentPageProps) {
  const { project } = await searchParams;
  return <VoiceAgentStudio projectId={project?.trim() || null} />;
}
