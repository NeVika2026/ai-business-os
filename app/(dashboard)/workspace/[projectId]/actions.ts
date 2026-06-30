'use server';

import { revalidatePath } from 'next/cache';

import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { USER_FACING_EXECUTION_ERROR } from '@/lib/ai/router-messages';
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
      return { status: 'failed', message: USER_FACING_EXECUTION_ERROR };
    }

    revalidatePath(`/workspace/${projectId}`);

    return { status: 'ok', content };
  } catch {
    return { status: 'failed', message: USER_FACING_EXECUTION_ERROR };
  }
}
