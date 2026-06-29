import { AskOSA } from '@/components/home/AskOSA';
import { ContinueWorking } from '@/components/home/ContinueWorking';
import { DailySummary } from '@/components/home/DailySummary';
import { GoalSelector } from '@/components/home/GoalSelector';
import { PinnedActions } from '@/components/home/PinnedActions';
import { RecentExecutions } from '@/components/home/RecentExecutions';
import { RecentProjects } from '@/components/home/RecentProjects';
import { SmartSuggestions } from '@/components/home/SmartSuggestions';
import { TodayFocus } from '@/components/home/TodayFocus';
import { WelcomeHero } from '@/components/home/WelcomeHero';
import type { HomeData } from '@/utils/home/home-types';

type AdaptiveHomeProps = {
  data: HomeData;
};

export function AdaptiveHome({ data }: AdaptiveHomeProps) {
  return (
    <div className="space-y-6">
      <WelcomeHero welcome={data.welcome} />
      <GoalSelector />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SmartSuggestions suggestions={data.suggestions} />
        <ContinueWorking data={data.continueWorking} />
      </div>

      <PinnedActions actions={data.pinnedActions} />
      <TodayFocus summary={data.dailySummary} />
      <DailySummary summary={data.dailySummary} />

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentProjects projects={data.recentProjects} />
        <RecentExecutions executions={data.recentExecutions} />
      </div>

      <AskOSA placeholders={data.askOsaPlaceholders} />
    </div>
  );
}
