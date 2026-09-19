import { CommunicationsStudio } from '@/components/platform/CommunicationsStudio';
import type { CommunicationChannel } from '@/app/(dashboard)/modules/communicate/actions';

type CommunicationsPageProps = {
  searchParams: Promise<{
    project?: string;
    phone?: string;
    channel?: string;
    lead?: string;
  }>;
};

export default async function CommunicationsPage({
  searchParams,
}: CommunicationsPageProps) {
  const { project, phone, channel, lead } = await searchParams;
  const initialChannel: CommunicationChannel =
    channel === 'sms' ? 'sms' : 'whatsapp';

  return (
    <CommunicationsStudio
      projectId={project?.trim() || null}
      initialPhone={phone?.trim() || ''}
      initialChannel={initialChannel}
      initialLeadId={lead?.trim() || null}
    />
  );
}
