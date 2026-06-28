import { CABINET_LAYOUT } from '@/utils/cabinet/cabinet-config';
import type { CabinetDashboardData } from '@/utils/cabinet/dashboard-mappers';

import { CabinetOverviewStats } from '@/components/cabinet/CabinetOverviewStats';
import { ModuleGrid } from '@/components/cabinet/ModuleGrid';
import { NotificationsPanel } from '@/components/cabinet/NotificationsPanel';
import { ProfileSummary } from '@/components/cabinet/ProfileSummary';
import { QuickActions } from '@/components/cabinet/QuickActions';
import { RecentActivity } from '@/components/cabinet/RecentActivity';
import { SystemHealth } from '@/components/cabinet/SystemHealth';
import { UsageStats } from '@/components/cabinet/UsageStats';
import { WorkspaceCard } from '@/components/cabinet/WorkspaceCard';

export type DashboardOverviewProps = {
  dashboard: CabinetDashboardData;
};

export function DashboardOverview({ dashboard }: DashboardOverviewProps) {
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
          Central operating system for {dashboard.profile.organizationName}. OSA orchestrates
          modules, workspace, and execution from one place.
        </p>
      </header>

      <CabinetOverviewStats overview={dashboard.overview} />

      <div className={CABINET_LAYOUT.overviewGrid}>
        <div className={CABINET_LAYOUT.profileColumn}>
          <ProfileSummary profile={dashboard.profile} />
          <div className="mt-4 sm:mt-5">
            <NotificationsPanel notifications={dashboard.notifications} />
          </div>
        </div>

        <div className={CABINET_LAYOUT.mainColumn}>
          <QuickActions actions={dashboard.quickActions} />
          <RecentActivity activity={dashboard.activity} history={dashboard.history} />
          <UsageStats usage={dashboard.usage} />
          <ModuleGrid modules={dashboard.modules} />
        </div>

        <div className={CABINET_LAYOUT.sideColumn}>
          <WorkspaceCard workspace={dashboard.workspace} />
          <SystemHealth items={dashboard.health} />
        </div>
      </div>
    </div>
  );
}
