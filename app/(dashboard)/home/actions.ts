'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadCabinetRawSnapshot } from '@/utils/cabinet/load-dashboard';
import { mapRunsToHistory } from '@/utils/cabinet/dashboard-mappers';
import {
  buildHomeHandoffEvents,
  buildHomeHandoffNavigation,
  isHomeGoalId,
  mapHandoffContextFromSnapshot,
  writeStoredHomeSession,
  type HomeHandoffNavigation,
} from '@/utils/home/goal-handoff';
import type { HomeGoalId } from '@/utils/home/home-types';

const RUNNING_STATUSES = new Set(['pending', 'running']);

export async function startGoalHandoff(
  goalId: string,
): Promise<
  { status: 'ok'; navigation: HomeHandoffNavigation } | { status: 'failed'; message: string }
> {
  if (!isHomeGoalId(goalId)) {
    return { status: 'failed', message: 'Unknown goal' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: 'failed', message: 'Unauthorized' };
  }

  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return { status: 'failed', message: 'Organization not found' };
  }

  try {
    const snapshot = await loadCabinetRawSnapshot(
      supabase,
      organizationId,
      user.email ?? 'unknown@example.com',
    );
    const runningRun = snapshot.runs.find((run) => RUNNING_STATUSES.has(run.status));
    const runningHistory = runningRun ? mapRunsToHistory([runningRun])[0] : null;
    const latestProject = snapshot.projects[0] ?? null;

    const context = mapHandoffContextFromSnapshot({
      projectCount: snapshot.projectCount,
      latestProject: latestProject ? { id: latestProject.id, name: latestProject.name } : null,
      runningExecution: runningHistory
        ? {
            id: runningHistory.id,
            label: runningHistory.label,
            href: runningHistory.href,
          }
        : null,
    });

    const navigation = buildHomeHandoffNavigation(goalId as HomeGoalId, context);
    const events = buildHomeHandoffEvents(navigation.session, organizationId, user.id);

    const { data: organization, error: organizationError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    if (organizationError) {
      throw organizationError;
    }

    const nextSettings = writeStoredHomeSession(
      (organization.settings as Record<string, unknown> | null) ?? {},
      user.id,
      navigation.session,
    );

    const { error: settingsError } = await supabase
      .from('organizations')
      .update({ settings: nextSettings })
      .eq('id', organizationId);

    if (settingsError) {
      throw settingsError;
    }

    const { error: eventsError } = await supabase.from('events').insert(events);

    if (eventsError) {
      throw eventsError;
    }

    revalidatePath('/home');
    revalidatePath('/osa');

    return { status: 'ok', navigation };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start goal handoff';
    return { status: 'failed', message };
  }
}
