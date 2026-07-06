'use server';

import { revalidatePath } from 'next/cache';

import { mapCaughtErrorToUserMessage } from '@/lib/ai/user-facing-errors';
import { resolveActiveProject } from '@/lib/project-runtime/active-project';
import { resolveProjectRuntimeScope } from '@/lib/project-runtime/scope';
import { syncProjectRuntimesFromSnapshot } from '@/lib/project-runtime/project-runtime-sync';
import { submitWorkspacePrompt } from '@/app/(dashboard)/workspace/[projectId]/actions';
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
import { loadHomeUserContext } from '@/utils/home/home-loader';
import type { HomeGoalId } from '@/utils/home/home-types';
import { buildWowHandoffContext } from '@/utils/home/wow-engine';
import { buildHomeTaskPrompt, homeTaskErrorHint, type HomeQuickActionId } from '@/utils/home/home-action';
import { resolveMissionControlProjectId } from '@/utils/mission-control/mission-control-mappers';

const RUNNING_STATUSES = new Set(['pending', 'running']);

export type SubmitHomeTaskResult =
  | { status: 'ok'; content: string; projectId: string }
  | { status: 'failed'; message: string; hint: string };

export async function submitHomeTask(
  input: string,
  quickActionId?: HomeQuickActionId,
): Promise<SubmitHomeTaskResult> {
  const prompt = buildHomeTaskPrompt(input, quickActionId);

  if (!prompt.trim()) {
    return {
      status: 'failed',
      message: 'Опишите задачу для OSA.',
      hint: 'Введите запрос или выберите быстрое действие.',
    };
  }

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return {
      status: 'failed',
      message: 'Требуется авторизация.',
      hint: homeTaskErrorHint('Требуется авторизация.'),
    };
  }

  const context = await loadHomeUserContext(supabase);

  if (!context) {
    return {
      status: 'failed',
      message: 'Не удалось определить пользователя.',
      hint: homeTaskErrorHint('Не удалось определить пользователя.'),
    };
  }

  const snapshot = await loadCabinetRawSnapshot(supabase, organizationId, context.email);
  syncProjectRuntimesFromSnapshot(snapshot, context);

  const scope = resolveProjectRuntimeScope(snapshot, context);
  const activeRuntime = resolveActiveProject(scope);
  const projectId = resolveMissionControlProjectId(activeRuntime, snapshot) ?? activeRuntime.id;

  try {
    const result = await submitWorkspacePrompt(projectId, prompt);

    if (result.status === 'failed') {
      return {
        status: 'failed',
        message: result.message,
        hint: homeTaskErrorHint(result.message),
      };
    }

    revalidatePath('/home');
    revalidatePath(`/workspace/${projectId}`);

    return {
      status: 'ok',
      content: result.content,
      projectId,
    };
  } catch (error) {
    const message = mapCaughtErrorToUserMessage(error, 'generic');

    return {
      status: 'failed',
      message,
      hint: homeTaskErrorHint(message),
    };
  }
}

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

    const userContext = await loadHomeUserContext(supabase);
    const wowContext = userContext
      ? buildWowHandoffContext(snapshot, {
          userName: userContext.userName,
          email: userContext.email,
          organizationName: userContext.organizationName,
        })
      : null;

    const { session } = buildHomeHandoffNavigation(
      goalId as HomeGoalId,
      context,
      undefined,
      wowContext,
    );
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
    return { status: 'failed', message: mapCaughtErrorToUserMessage(error, 'generic') };
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
