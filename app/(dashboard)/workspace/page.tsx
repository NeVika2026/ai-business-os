import { redirect } from 'next/navigation';

import { InvisibleWorkspaceFlow } from '@/components/osa/osa-onboarding-flow';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { openHandoffSession, parseHandoffIdFromSearchParams } from '@/utils/home/handoff-session';

type WorkspacePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
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

  if (!handoffId) {
    redirect('/home');
  }

  let homeHandoff = null;
  let handoffError: 'expired' | 'invalid' | 'consumed' | null = null;
  let activeHandoffId: string | null = null;

  const result = await openHandoffSession(supabase, handoffId, organizationId, user.id);

  if (result.status === 'ok') {
    homeHandoff = result.handoff;
    activeHandoffId = result.handoffId;
  } else {
    handoffError = result.status;
  }

  return (
    <InvisibleWorkspaceFlow
      homeHandoff={homeHandoff}
      handoffId={activeHandoffId}
      handoffError={handoffError}
    />
  );
}
