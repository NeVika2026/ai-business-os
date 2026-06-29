import { AIConciergeHeader } from '@/components/home/AIConciergeHeader';
import { ContinueJourney } from '@/components/home/ContinueJourney';
import { ConversationStarter } from '@/components/home/ConversationStarter';
import { DailyMission } from '@/components/home/DailyMission';
import { PersonalInsights } from '@/components/home/PersonalInsights';
import { SuggestedJourneys } from '@/components/home/SuggestedJourneys';
import type { ConciergeData } from '@/utils/home/concierge-mappers';

type AIConciergeProps = {
  data: ConciergeData;
};

export function AIConcierge({ data }: AIConciergeProps) {
  return (
    <div className="space-y-6">
      <AIConciergeHeader greeting={data.greeting} />
      <ConversationStarter chips={data.conversationChips} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SuggestedJourneys journeys={data.suggestedJourneys} />
        <ContinueJourney journey={data.continueJourney} />
      </div>
      <PersonalInsights insights={data.insights} />
      <DailyMission mission={data.dailyMission} />
    </div>
  );
}
