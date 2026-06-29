'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { mapRunsToHistory } from '@/utils/cabinet/dashboard-mappers';
import { loadCabinetRawSnapshot } from '@/utils/cabinet/load-dashboard';
import {
  buildHomeHandoffNavigation,
  isHomeGoalId,
  mapHandoffContextFromSnapshot,
} from '@/utils/home/goal-handoff';
import {
  consumeHandoffSession,
  createPersistedHandoffSession,
  expireOldHandoffs,
} from '@/utils/home/handoff-session';
import type { HomeGoalId } from '@/utils/home/home-types';

const RUNNING_STATUSES = new Set(['pending', 'running']);

export type StartGoalHandoffResult =
  | { status: 'ok'; handoffId: string; url: string }
  | { status: 'failed'; message: string };

export async function startGoalHandoff(goalId: string): Promise<StartGoalHandoffResult> {
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
    await expireOldHandoffs(supabase, organizationId);

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

    const { session } = buildHomeHandoffNavigation(goalId as HomeGoalId, context);
    const persisted = await createPersistedHandoffSession(
      supabase,
      session,
      organizationId,
      user.id,
    );

    revalidatePath('/home');
    revalidatePath('/workspace');

    return {
      status: 'ok',
      handoffId: persisted.handoffId,
      url: persisted.url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start goal handoff';
    return { status: 'failed', message };
  }
}

export async function consumeHomeHandoff(handoffId: string): Promise<boolean> {
  if (!handoffId.trim()) {
    return false;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return false;
  }

  const consumed = await consumeHandoffSession(supabase, handoffId, organizationId, user.id);

  if (consumed) {
    revalidatePath('/workspace');
    revalidatePath('/home');
  }

  return consumed;
}
