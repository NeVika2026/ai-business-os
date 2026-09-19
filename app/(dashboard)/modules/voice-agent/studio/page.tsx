import { VoiceAgentStudio } from '@/components/platform/VoiceAgentStudio';

type VoiceAgentPageProps = {
  searchParams: Promise<{ project?: string; phone?: string }>;
};

export default async function VoiceAgentPage({ searchParams }: VoiceAgentPageProps) {
  const { project, phone } = await searchParams;
  return (
    <VoiceAgentStudio
      projectId={project?.trim() || null}
      initialPhone={phone?.trim() || ''}
    />
  );
}
