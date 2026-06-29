import { redirect } from 'next/navigation';

import { OsaOnboardingFlow } from '@/components/osa/osa-onboarding-flow';
import { OsaRunHistory } from '@/components/osa/osa-run-history';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { openHandoffSession, parseHandoffIdFromSearchParams } from '@/utils/home/handoff-session';
import { loadOsaRunHistory } from '@/utils/osa/load-osa-run-history';

type OsaPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OsaPage({ searchParams }: OsaPageProps) {
  const resolvedSearchParams = await searchParams;
  const handoffId = parseHandoffIdFromSearchParams(resolvedSearchParams);
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!organizationId || !user) {
    redirect('/login');
  }

  let homeHandoff = null;
  let handoffError: 'expired' | 'invalid' | 'consumed' | null = null;
  let activeHandoffId: string | null = null;

  if (handoffId) {
    const result = await openHandoffSession(supabase, handoffId, organizationId, user.id);

    if (result.status === 'ok') {
      homeHandoff = result.handoff;
      activeHandoffId = result.handoffId;
    } else {
      handoffError = result.status;
    }
  }

  const { runs, eventsByRunId } = await loadOsaRunHistory();

  return (
    <div className="space-y-10">
      <OsaOnboardingFlow
        homeHandoff={homeHandoff}
        handoffId={activeHandoffId}
        handoffError={handoffError}
      />
      <OsaRunHistory runs={runs} eventsByRunId={eventsByRunId} />
    </div>
  );
}
