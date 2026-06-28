import { OsaOnboardingFlow } from '@/components/osa/osa-onboarding-flow';
import { OsaRunHistory } from '@/components/osa/osa-run-history';
import { loadOsaRunHistory } from '@/utils/osa/load-osa-run-history';

export default async function OsaPage() {
  const { runs, eventsByRunId } = await loadOsaRunHistory();

  return (
    <div className="space-y-10">
      <OsaOnboardingFlow />
      <OsaRunHistory runs={runs} eventsByRunId={eventsByRunId} />
    </div>
  );
}
