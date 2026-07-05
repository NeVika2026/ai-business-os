import { OrbitMark } from '@/components/brand/OrbitMark';
import { PersonalWelcome } from '@/components/home/PersonalWelcome';
import { SmartGreeting } from '@/components/home/SmartGreeting';
import { ContinueJourney } from '@/components/home/ContinueJourney';
import { ConversationStarter } from '@/components/home/ConversationStarter';
import { OsaAssistantPanel } from '@/components/home/OsaAssistantPanel';
import type { ConciergeData } from '@/utils/home/concierge-mappers';

type AIConciergeProps = {
  data: ConciergeData;
};

function hasPreviousWork(data: ConciergeData): boolean {
  return (
    data.continueJourney.runningExecutionLabel !== null ||
    data.continueJourney.projectName !== null ||
    data.continueJourney.resumeHref !== '/home'
  );
}

export function AIConcierge({ data }: AIConciergeProps) {
  const showContinue = hasPreviousWork(data);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="osa-seq-orbit flex justify-center">
        <OrbitMark size="sm" />
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] xl:gap-10">
        <div className="space-y-10">
          <div className="osa-seq-greeting space-y-6">
            <SmartGreeting greeting={data.smartGreeting} />
            <PersonalWelcome welcome={data.personalWelcome} />
          </div>

          <div className="osa-seq-workspace space-y-8">
            <ConversationStarter chips={data.conversationChips} />
            {showContinue ? <ContinueJourney journey={data.continueJourney} /> : null}
          </div>
        </div>

        <div className="osa-seq-navigator xl:pt-1">
          <OsaAssistantPanel insights={data.insights} dailyMission={data.dailyMission} />
        </div>
      </div>
    </div>
  );
}
