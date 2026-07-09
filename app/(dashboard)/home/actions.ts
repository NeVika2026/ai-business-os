'use server';

import { revalidatePath } from 'next/cache';

import { mapCaughtErrorToUserMessage } from '@/lib/ai/user-facing-errors';
import { loadProjectDeliverablesPackage } from '@/lib/deliverables/deliverables-engine';
import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import {
  advanceAiOrchestraForProject,
  loadProjectOrchestra,
  resolveOrchestraBlocked,
} from '@/lib/project-lifecycle/ai-orchestra-engine';
import { runProjectLifecycle } from '@/lib/project-lifecycle/run-project-lifecycle';
import { resolveActiveProject } from '@/lib/project-runtime/active-project';
import { findProjectRuntime } from '@/lib/project-runtime/project-runtime-engine';
import { resolveProjectRuntimeScope } from '@/lib/project-runtime/scope';
import { syncProjectRuntimesFromSnapshot } from '@/lib/project-runtime/project-runtime-sync';
import { submitWorkspacePrompt } from '@/app/(dashboard)/workspace/[projectId]/actions';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
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
import {
  buildHomeTaskPrompt,
  homeTaskErrorHint,
  type HomeQuickActionId,
} from '@/utils/home/home-action';
import {
  buildClarificationQuestions,
  buildEnrichedRealWorkPrompt,
  classifyRealWorkTaskType,
  mapTaskTypeToDeliverableType,
  mapTaskTypeToProjectType,
  needsClarification,
  serializeHomeDeliverable,
  type ClarificationAnswer,
  type HomeDeliverablePayload,
  type RealWorkTaskType,
} from '@/utils/home/real-work-mode';
import { resolveMissionControlProjectId } from '@/utils/mission-control/mission-control-mappers';
import type { ProjectDeliverable } from '@/types/deliverables';
import type { AiOrchestraState } from '@/types/ai-orchestra';
import { mapRunsToHistory } from '@/utils/cabinet/dashboard-mappers';

const RUNNING_STATUSES = new Set(['pending', 'running']);
const ORCHESTRA_STEP_LIMIT = 12;

export type HomeOrchestraSnapshot = {
  activeAgentName: string | null;
  activeAgentRole: string | null;
  activeActivity: string | null;
  overallProgress: number;
};

export type SubmitHomeTaskResult =
  | { status: 'ok'; deliverable: HomeDeliverablePayload; projectId: string }
  | { status: 'failed'; message: string; hint: string };

export type StartHomeRealWorkResult =
  | {
      status: 'clarify';
      taskType: RealWorkTaskType;
      questions: string[];
      projectId: string;
    }
  | {
      status: 'working';
      taskType: RealWorkTaskType;
      projectId: string;
      orchestra: HomeOrchestraSnapshot;
    }
  | { status: 'ok'; deliverable: HomeDeliverablePayload; projectId: string }
  | { status: 'failed'; message: string; hint: string };

export type AdvanceHomeRealWorkResult =
  | {
      status: 'working';
      orchestra: HomeOrchestraSnapshot;
    }
  | { status: 'ok'; deliverable: HomeDeliverablePayload }
  | { status: 'failed'; message: string; hint: string };

type HomeExecutionContext = {
  organizationId: string;
  userId: string;
  email: string;
  projectId: string;
  scope: {
    organizationId: string;
    userId: string;
  };
};

async function resolveHomeExecutionContext(): Promise<HomeExecutionContext | { error: SubmitHomeTaskResult }> {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return {
      error: {
        status: 'failed',
        message: 'Требуется авторизация.',
        hint: homeTaskErrorHint('Требуется авторизация.'),
      },
    };
  }

  const context = await loadHomeUserContext(supabase);

  if (!context) {
    return {
      error: {
        status: 'failed',
        message: 'Не удалось определить пользователя.',
        hint: homeTaskErrorHint('Не удалось определить пользователя.'),
      },
    };
  }

  const snapshot = await loadCabinetRawSnapshot(supabase, organizationId, context.email);
  syncProjectRuntimesFromSnapshot(snapshot, context);

  const scope = resolveProjectRuntimeScope(snapshot, context);
  const activeRuntime = resolveActiveProject(scope);
  const projectId = resolveMissionControlProjectId(activeRuntime, snapshot) ?? activeRuntime.id;

  return {
    organizationId,
    userId: context.email,
    email: context.email,
    projectId,
    scope: {
      organizationId,
      userId: context.email,
    },
  };
}

function toOrchestraSnapshot(orchestra: AiOrchestraState | null): HomeOrchestraSnapshot {
  const activeAgent = orchestra?.queue.find((agent) => agent.id === orchestra.activeAgentId) ?? null;

  return {
    activeAgentName: activeAgent?.name ?? null,
    activeAgentRole: activeAgent?.role ?? null,
    activeActivity: activeAgent?.currentActivity ?? null,
    overallProgress: orchestra?.overallProgress ?? 0,
  };
}

function findTargetDeliverable(
  deliverables: ProjectDeliverable[],
  targetType: ReturnType<typeof mapTaskTypeToDeliverableType>,
): ProjectDeliverable | null {
  const exact = deliverables.find((item) => item.type === targetType && item.phase === 'ready');

  if (exact) {
    return exact;
  }

  return deliverables.find((item) => item.phase === 'ready') ?? null;
}

function toDeliverablePayload(deliverable: ProjectDeliverable): HomeDeliverablePayload {
  return serializeHomeDeliverable({
    id: deliverable.id,
    type: deliverable.type,
    title: deliverable.title,
    summary: deliverable.summary,
    content: deliverable.content,
    currentVersion: deliverable.currentVersion,
    agentRole: deliverable.agentRole,
  });
}

function ensureProjectOrchestra(
  projectId: string,
  taskType: RealWorkTaskType,
  context: HomeExecutionContext,
): void {
  if (loadProjectOrchestra(projectId)) {
    return;
  }

  const runtime = findProjectRuntime(projectId);
  const name = runtime?.title ?? 'Проект OSA';
  const description = runtime?.description ?? '';

  runProjectLifecycle({
    projectId,
    name,
    description,
    declaredType: mapTaskTypeToProjectType(taskType),
    organizationId: context.organizationId,
    userId: context.userId,
  });
}

function advanceOrchestraStep(
  projectId: string,
  context: HomeExecutionContext,
): AiOrchestraState | null {
  const runtime = findProjectRuntime(projectId);
  const executive = getLastExecutiveDecision(context.scope);

  let orchestra = loadProjectOrchestra(projectId);

  if (!orchestra) {
    return null;
  }

  if (orchestra.queue.some((agent) => agent.status === 'blocked')) {
    orchestra =
      resolveOrchestraBlocked(projectId, context.scope, {
        organizationId: context.organizationId,
        userId: context.userId,
        goal: executive?.goal,
      }) ?? orchestra;
  }

  return (
    advanceAiOrchestraForProject(projectId, context.scope, {
      organizationId: context.organizationId,
      userId: context.userId,
      projectName: runtime?.title ?? projectId,
      goal: executive?.goal,
      unblock: orchestra.queue.some((agent) => agent.status === 'blocked'),
    }) ?? orchestra
  );
}

function runOrchestraUntilDeliverableReady(
  projectId: string,
  taskType: RealWorkTaskType,
  context: HomeExecutionContext,
): ProjectDeliverable | null {
  const targetType = mapTaskTypeToDeliverableType(taskType);

  for (let step = 0; step < ORCHESTRA_STEP_LIMIT; step += 1) {
    const pkg = loadProjectDeliverablesPackage(projectId);
    const ready = findTargetDeliverable(pkg?.deliverables ?? [], targetType);

    if (ready) {
      return ready;
    }

    const orchestra = loadProjectOrchestra(projectId);

    if (!orchestra) {
      break;
    }

    if (orchestra.queue.every((agent) => agent.status === 'completed')) {
      break;
    }

    advanceOrchestraStep(projectId, context);
  }

  const finalPackage = loadProjectDeliverablesPackage(projectId);
  return findTargetDeliverable(finalPackage?.deliverables ?? [], targetType);
}

export async function startHomeRealWork(
  input: string,
  options?: {
    quickActionId?: HomeQuickActionId;
    taskType?: RealWorkTaskType;
    clarifications?: ClarificationAnswer[];
  },
): Promise<StartHomeRealWorkResult> {
  const basePrompt = buildHomeTaskPrompt(input, options?.quickActionId);

  if (!basePrompt.trim()) {
    return {
      status: 'failed',
      message: 'Опишите задачу для OSA.',
      hint: 'Введите запрос или выберите быстрое действие.',
    };
  }

  const resolved = await resolveHomeExecutionContext();

  if ('error' in resolved) {
    return resolved.error;
  }

  const taskType =
    options?.taskType ?? classifyRealWorkTaskType(basePrompt, options?.quickActionId);

  if (!options?.clarifications?.length) {
    const questions = buildClarificationQuestions(taskType, basePrompt);

    if (needsClarification(basePrompt, taskType) && questions.length > 0) {
      return {
        status: 'clarify',
        taskType,
        questions,
        projectId: resolved.projectId,
      };
    }
  }

  const prompt = buildEnrichedRealWorkPrompt(
    basePrompt,
    taskType,
    options?.clarifications ?? [],
  );

  try {
    ensureProjectOrchestra(resolved.projectId, taskType, resolved);

    const result = await submitWorkspacePrompt(resolved.projectId, prompt);

    if (result.status === 'failed') {
      return {
        status: 'failed',
        message: result.message,
        hint: homeTaskErrorHint(result.message),
      };
    }

    const targetType = mapTaskTypeToDeliverableType(taskType);
    const pkg = loadProjectDeliverablesPackage(resolved.projectId);
    const ready = findTargetDeliverable(pkg?.deliverables ?? [], targetType);

    revalidatePath('/home');
    revalidatePath(`/workspace/${resolved.projectId}`);

    if (ready) {
      return {
        status: 'ok',
        deliverable: toDeliverablePayload(ready),
        projectId: resolved.projectId,
      };
    }

    return {
      status: 'working',
      taskType,
      projectId: resolved.projectId,
      orchestra: toOrchestraSnapshot(loadProjectOrchestra(resolved.projectId)),
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

export async function getHomeDeliverableResult(
  projectId: string,
  deliverableId: string,
): Promise<HomeDeliverablePayload | null> {
  const pkg = loadProjectDeliverablesPackage(projectId);
  const deliverable = pkg?.deliverables.find((item) => item.id === deliverableId) ?? null;

  if (!deliverable || deliverable.phase !== 'ready') {
    return null;
  }

  return toDeliverablePayload(deliverable);
}

export async function advanceHomeRealWork(
  projectId: string,
  taskType: RealWorkTaskType,
): Promise<AdvanceHomeRealWorkResult> {
  const resolved = await resolveHomeExecutionContext();

  if ('error' in resolved) {
    return resolved.error;
  }

  if (resolved.projectId !== projectId) {
    return {
      status: 'failed',
      message: 'Проект недоступен.',
      hint: homeTaskErrorHint('Проект недоступен.'),
    };
  }

  try {
    const targetType = mapTaskTypeToDeliverableType(taskType);
    const existing = loadProjectDeliverablesPackage(projectId);
    const ready = findTargetDeliverable(existing?.deliverables ?? [], targetType);

    if (ready) {
      revalidatePath('/home');
      revalidatePath(`/workspace/${projectId}`);

      return {
        status: 'ok',
        deliverable: toDeliverablePayload(ready),
      };
    }

    const orchestra = loadProjectOrchestra(projectId);

    if (!orchestra || orchestra.queue.every((agent) => agent.status === 'completed')) {
      const fallback = findTargetDeliverable(existing?.deliverables ?? [], targetType);

      if (!fallback) {
        return {
          status: 'failed',
          message: 'Не удалось собрать результат.',
          hint: homeTaskErrorHint('Не удалось собрать результат.'),
        };
      }

      return {
        status: 'ok',
        deliverable: toDeliverablePayload(fallback),
      };
    }

    advanceOrchestraStep(projectId, resolved);

    const pkg = loadProjectDeliverablesPackage(projectId);
    const deliverable = findTargetDeliverable(pkg?.deliverables ?? [], targetType);

    revalidatePath('/home');
    revalidatePath(`/workspace/${projectId}`);

    if (deliverable) {
      return {
        status: 'ok',
        deliverable: toDeliverablePayload(deliverable),
      };
    }

    return {
      status: 'working',
      orchestra: toOrchestraSnapshot(loadProjectOrchestra(projectId)),
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

/** @deprecated Use startHomeRealWork — kept for compatibility with older callers. */
export async function submitHomeTask(
  input: string,
  quickActionId?: HomeQuickActionId,
): Promise<SubmitHomeTaskResult> {
  const result = await startHomeRealWork(input, { quickActionId });

  if (result.status === 'clarify') {
    return {
      status: 'failed',
      message: 'Нужны уточнения по задаче.',
      hint: 'Ответьте на вопросы и отправьте снова.',
    };
  }

  if (result.status === 'working') {
    const { projectId, taskType: activeTaskType } = result;

    for (let step = 0; step < ORCHESTRA_STEP_LIMIT; step += 1) {
      const advanced = await advanceHomeRealWork(projectId, activeTaskType);

      if (advanced.status === 'ok') {
        return {
          status: 'ok',
          deliverable: advanced.deliverable,
          projectId,
        };
      }

      if (advanced.status === 'failed') {
        return advanced;
      }
    }

    return {
      status: 'failed',
      message: 'Не удалось собрать результат.',
      hint: homeTaskErrorHint('Не удалось собрать результат.'),
    };
  }

  return result;
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
