import { OsaOnboardingFlow } from '@/components/osa/osa-onboarding-flow';
import { OsaRunHistory } from '@/components/osa/osa-run-history';
import { parseOsaHomeHandoffInput } from '@/utils/home/goal-handoff';
import { loadOsaRunHistory } from '@/utils/osa/load-osa-run-history';

type OsaPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OsaPage({ searchParams }: OsaPageProps) {
  const resolvedSearchParams = await searchParams;
  const homeHandoff = parseOsaHomeHandoffInput(resolvedSearchParams);
  const { runs, eventsByRunId } = await loadOsaRunHistory();

  return (
    <div className="space-y-10">
      <OsaOnboardingFlow homeHandoff={homeHandoff} />
      <OsaRunHistory runs={runs} eventsByRunId={eventsByRunId} />
    </div>
  );
}
