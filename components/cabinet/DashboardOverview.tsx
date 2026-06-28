import { CABINET_LAYOUT } from '@/utils/cabinet/cabinet-config';

import { ModuleGrid } from '@/components/cabinet/ModuleGrid';
import { NotificationsPanel } from '@/components/cabinet/NotificationsPanel';
import { ProfileSummary, type ProfileSummaryProps } from '@/components/cabinet/ProfileSummary';
import { QuickActions } from '@/components/cabinet/QuickActions';
import { RecentActivity } from '@/components/cabinet/RecentActivity';
import { SystemHealth } from '@/components/cabinet/SystemHealth';
import { UsageStats } from '@/components/cabinet/UsageStats';
import { WorkspaceCard } from '@/components/cabinet/WorkspaceCard';

export type DashboardOverviewProps = ProfileSummaryProps;

export function DashboardOverview({ email, organizationName }: DashboardOverviewProps) {
  return (
    <div className={CABINET_LAYOUT.page}>
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
          Personal Cabinet
        </p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
          AI Business OS
        </h1>
        <p className="max-w-2xl text-sm text-[var(--text-secondary)] sm:text-base">
          Central operating system for your organization. OSA orchestrates modules, workspace, and
          execution from one place.
        </p>
      </header>

      <div className={CABINET_LAYOUT.overviewGrid}>
        <div className={CABINET_LAYOUT.profileColumn}>
          <ProfileSummary email={email} organizationName={organizationName} />
          <div className="mt-4 sm:mt-5">
            <NotificationsPanel />
          </div>
        </div>

        <div className={CABINET_LAYOUT.mainColumn}>
          <QuickActions />
          <RecentActivity />
          <UsageStats />
          <ModuleGrid />
        </div>

        <div className={CABINET_LAYOUT.sideColumn}>
          <WorkspaceCard />
          <SystemHealth />
        </div>
      </div>
    </div>
  );
}
