'use server';

import { revalidatePath } from 'next/cache';

import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { USER_FACING_EXECUTION_ERROR } from '@/lib/ai/router-messages';
import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import { advanceAiOrchestraForProject, resolveOrchestraBlocked } from '@/lib/project-lifecycle/ai-orchestra-engine';
import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import { setActiveProject, resolveGatewayProjectId } from '@/lib/project-runtime/active-project';
import { findProjectRuntime } from '@/lib/project-runtime/project-runtime-engine';
import { syncProjectRuntimesFromSnapshot } from '@/lib/project-runtime/project-runtime-sync';
import type { GatewayRequest } from '@/types/runtime/dto';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadCabinetRawSnapshot } from '@/utils/cabinet/load-dashboard';
import { loadHomeUserContext } from '@/utils/home/home-loader';

export type WorkspacePromptResult =
  | { status: 'ok'; content: string }
  | { status: 'failed'; message: string };

export type OrchestraActionResult =
  | { status: 'ok' }
  | { status: 'failed'; message: string };

export async function submitWorkspacePrompt(
  projectId: string,
  prompt: string,
): Promise<WorkspacePromptResult> {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return { status: 'failed', message: 'Введите задачу для OSA.' };
  }

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return { status: 'failed', message: 'Требуется авторизация.' };
  }

  const context = await loadHomeUserContext(supabase);

  if (!context) {
    return { status: 'failed', message: 'Не удалось определить пользователя.' };
  }

  const snapshot = await loadCabinetRawSnapshot(supabase, organizationId, context.email);
  syncProjectRuntimesFromSnapshot(snapshot, context);

  const scope = {
    organizationId,
    userId: context.email,
  };

  setActiveProject(scope, projectId);

  const runtime = findProjectRuntime(projectId);

  if (!runtime) {
    return { status: 'failed', message: 'Проект не найден в Runtime.' };
  }

  const runId = crypto.randomUUID();
  const correlationId = crypto.randomUUID();
  const traceId = crypto.randomUUID();
  const gatewayProjectId = resolveGatewayProjectId(scope) ?? projectId;

  publishRuntimeEvent({
    projectId,
    type: RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_SUBMITTED,
    actor: `user:${context.email}`,
    source: 'workspace',
    status: 'pending',
    payload: {
      promptLength: trimmed.length,
      runId,
    },
  });

  const request: GatewayRequest = {
    scope: {
      organizationId,
      userId: context.email,
      projectId: gatewayProjectId,
    },
    trace: {
      runId,
      traceId,
      correlationId,
    },
    providerCode: 'auto',
    modelCode: 'auto',
    messages: [
      {
        role: 'user',
        content: `Проект: ${runtime.title}\n\nЗадача:\n${trimmed}`,
      },
    ],
    tools: [],
    parameters: {
      temperature: 0.35,
      maxTokens: 768,
    },
    timeoutMs: 45_000,
    retryPolicy: {
      maxAttempts: 2,
      backoffMs: [500, 1500],
    },
  };

  try {
    const response = await aiGateway.complete(request);
    const content = response.content?.trim();

    if (!content) {
      publishRuntimeEvent({
        projectId,
        type: RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_FAILED,
        actor: `user:${context.email}`,
        source: 'workspace',
        status: 'failed',
        payload: {
          runId,
          reason: 'empty_response',
        },
      });

      return { status: 'failed', message: USER_FACING_EXECUTION_ERROR };
    }

    const executive = getLastExecutiveDecision(scope);

    advanceAiOrchestraForProject(projectId, scope, {
      organizationId,
      userId: context.email,
      projectName: runtime.title,
      goal: executive?.goal,
    });

    publishRuntimeEvent({
      projectId,
      type: RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_COMPLETED,
      actor: `user:${context.email}`,
      source: 'workspace',
      payload: {
        runId,
        responseLength: content.length,
      },
    });

    revalidatePath(`/workspace/${projectId}`);

    return { status: 'ok', content };
  } catch {
    publishRuntimeEvent({
      projectId,
      type: RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_FAILED,
      actor: `user:${context.email}`,
      source: 'workspace',
      status: 'failed',
      payload: {
        runId,
        reason: 'gateway_error',
      },
    });

    return { status: 'failed', message: USER_FACING_EXECUTION_ERROR };
  }
}

export async function resolveOrchestraDecision(projectId: string): Promise<OrchestraActionResult> {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return { status: 'failed', message: 'Требуется авторизация.' };
  }

  const context = await loadHomeUserContext(supabase);

  if (!context) {
    return { status: 'failed', message: 'Не удалось определить пользователя.' };
  }

  const snapshot = await loadCabinetRawSnapshot(supabase, organizationId, context.email);
  syncProjectRuntimesFromSnapshot(snapshot, context);

  const scope = {
    organizationId,
    userId: context.email,
  };

  setActiveProject(scope, projectId);

  const executive = getLastExecutiveDecision(scope);
  const next = resolveOrchestraBlocked(projectId, scope, {
    organizationId,
    userId: context.email,
    goal: executive?.goal,
  });

  if (!next) {
    return { status: 'failed', message: 'Orchestra не найдена для этого проекта.' };
  }

  publishRuntimeEvent({
    projectId,
    type: RUNTIME_EVENT_TYPES.WORKSPACE_ORCHESTRA_RESOLVED,
    actor: `user:${context.email}`,
    source: 'workspace',
    payload: {
      overallProgress: next.overallProgress,
      activeAgentId: next.activeAgentId,
    },
  });

  revalidatePath(`/workspace/${projectId}`);

  return { status: 'ok' };
}

export async function continueInvestorDemoOrchestra(projectId: string): Promise<OrchestraActionResult> {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return { status: 'failed', message: 'Требуется авторизация.' };
  }

  const context = await loadHomeUserContext(supabase);

  if (!context) {
    return { status: 'failed', message: 'Не удалось определить пользователя.' };
  }

  const snapshot = await loadCabinetRawSnapshot(supabase, organizationId, context.email);
  syncProjectRuntimesFromSnapshot(snapshot, context);

  const scope = {
    organizationId,
    userId: context.email,
  };

  setActiveProject(scope, projectId);

  const runtime = findProjectRuntime(projectId);

  if (!runtime) {
    return { status: 'failed', message: 'Проект не найден в Runtime.' };
  }

  const executive = getLastExecutiveDecision(scope);

  advanceAiOrchestraForProject(projectId, scope, {
    organizationId,
    userId: context.email,
    projectName: runtime.title,
    goal: executive?.goal,
  });

  revalidatePath(`/workspace/${projectId}`);

  return { status: 'ok' };
}
