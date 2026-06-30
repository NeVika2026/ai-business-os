'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { saveFirstResult } from '@/lib/login/first-result-store';
import { USER_FACING_EXECUTION_ERROR } from '@/lib/ai/router-messages';
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
        content: `Ты — член моей команды в AI Business OS. Помоги мне сделать первый шаг.\n\nМоя задача:\n\"${trimmed}\"\n\nОтветь коротким планом действий в 4–6 пунктов, на русском языке, без технических терминов и без ссылок на модели ИИ.`,
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

  try {
    const response = await aiGateway.complete(request);
    const content = response.content ?? '';

    if (!content.trim()) {
      throw new Error('empty_content');
    }

    const id = crypto.randomUUID();
    saveFirstResult(id, content.trim());
    redirect(`/login/first-result?id=${encodeURIComponent(id)}`);
  } catch {
    const id = crypto.randomUUID();
    saveFirstResult(id, USER_FACING_EXECUTION_ERROR);
    redirect(`/login/first-result?id=${encodeURIComponent(id)}&error=1`);
  }
}

