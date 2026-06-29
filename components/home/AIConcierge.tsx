import { PersonalWelcome } from '@/components/home/PersonalWelcome';
import { SmartGreeting } from '@/components/home/SmartGreeting';
import { VoiceWelcome } from '@/components/home/VoiceWelcome';
import { ContinueJourney } from '@/components/home/ContinueJourney';
import { ConversationStarter } from '@/components/home/ConversationStarter';
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
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <SmartGreeting greeting={data.smartGreeting} />
      {!showContinue ? <VoiceWelcome className="wow-fade-in wow-delay-1 -mt-5" /> : null}
      <PersonalWelcome welcome={data.personalWelcome} />
      <ConversationStarter chips={data.conversationChips} />
      {showContinue ? <ContinueJourney journey={data.continueJourney} /> : null}
    </div>
  );
}
