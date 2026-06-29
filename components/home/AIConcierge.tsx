import { AIConciergeHeader } from '@/components/home/AIConciergeHeader';
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
      <AIConciergeHeader greeting={data.greeting} />
      <ConversationStarter chips={data.conversationChips} />
      {showContinue ? <ContinueJourney journey={data.continueJourney} /> : null}
    </div>
  );
}
