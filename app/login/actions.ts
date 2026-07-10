'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import {
  buildFirstResultGatewayPrompt,
  buildFirstResultFallbackPlan,
  resolveFirstPlanContent,
} from '@/lib/login/first-result-plan';
import { saveFirstResult } from '@/lib/login/first-result-store';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import type { GatewayRequest } from '@/types/runtime/dto';
import { createClient } from '@/services/supabase/server';

function getOrigin(headersList: Headers) {
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';

  if (host) {
    return `${protocol}://${host}`;
  }

  return 'http://127.0.0.1:3000';
}

function logFirstResultEvent(input: {
  runId: string;
  status: 'completed' | 'failed';
  usedFallback: boolean;
  reason?: string;
  contentLength: number;
}) {
  publishRuntimeEvent({
    projectId: null,
    type:
      input.status === 'completed'
        ? RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_COMPLETED
        : RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_FAILED,
    actor: 'system:login-first-result',
    source: 'workspace',
    status: input.status === 'completed' ? 'completed' : 'failed',
    payload: {
      runId: input.runId,
      intent: 'login_first_result',
      usedFallback: input.usedFallback,
      reason: input.reason ?? null,
      contentLength: input.contentLength,
    },
  });
}

export async function sendMagicLink(formData: FormData) {
  const email = formData.get('email');

  if (typeof email !== 'string' || !email.trim()) {
    redirect('/login/sign-in?error=invalid_email');
  }

  const headersList = await headers();
  const origin = getOrigin(headersList);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect('/login/sign-in?error=send_failed');
  }

  redirect('/login/sign-in?sent=1');
}

export async function generateFirstPlan(formData: FormData) {
  const task = formData.get('task');
  const trimmed = typeof task === 'string' ? task.trim() : '';

  if (!trimmed) {
    redirect('/login/intro');
  }

  const runId = crypto.randomUUID();
  const correlationId = crypto.randomUUID();
  const traceId = crypto.randomUUID();
  const organizationId = 'org-login-preview';
  const userId = 'user-login-preview';

  const request: GatewayRequest = {
    scope: {
      organizationId,
      userId,
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
        content: buildFirstResultGatewayPrompt(trimmed),
      },
    ],
    tools: [],
    parameters: {
      temperature: 0.3,
      maxTokens: 512,
    },
    timeoutMs: 30_000,
    retryPolicy: {
      maxAttempts: 3,
      backoffMs: [500, 1000, 2000],
    },
    routing: {
      intent: 'login_first_result',
      taskCategory: 'planning',
      estimatedContextLength: trimmed.length,
      reasoningComplexity: 'medium',
      latencyTarget: 'balanced',
      costTarget: 'balanced',
      toolUsage: false,
    },
  };

  let gatewayContent: string | null = null;
  let failureReason: string | undefined;

  try {
    const response = await aiGateway.complete(request);
    gatewayContent = response.content ?? null;

    if (!gatewayContent?.trim()) {
      failureReason = 'empty_response';
    }
  } catch (error) {
    failureReason = error instanceof Error ? error.message : 'gateway_error';
  }

  const resolved = resolveFirstPlanContent(trimmed, gatewayContent);
  const content = resolved.content;

  logFirstResultEvent({
    runId,
    status: 'completed',
    usedFallback: resolved.usedFallback,
    reason: failureReason,
    contentLength: content.length,
  });

  const id = crypto.randomUUID();
  saveFirstResult(id, content, trimmed, {
    usedFallback: resolved.usedFallback,
    failureReason: failureReason ?? null,
  });
  redirect(`/login/first-result?id=${encodeURIComponent(id)}`);
}
