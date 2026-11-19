'use server';

import {
  getMediaGenerationStatusAction,
  startMediaGenerationAction,
} from '@/app/(dashboard)/modules/create/studio/actions';
import {
  isPaidAiConfigured,
  MINI_AI_PRICING,
  type MiniAiKind,
  validatePaidAiStart,
} from '@/lib/media/mini-ai-gate';

export type MiniAiAvailability = {
  enabled: boolean;
  credits: number;
  dollars: string;
  description: string;
};

export async function getMiniAiAvailabilityAction(kind: MiniAiKind): Promise<MiniAiAvailability> {
  const price = MINI_AI_PRICING[kind];
  return {
    enabled: isPaidAiConfigured(process.env),
    credits: price.credits,
    dollars: price.dollars,
    description: price.description,
  };
}

export async function startMiniAiGenerationAction(input: {
  kind: MiniAiKind;
  prompt: string;
  approved: boolean;
  quotedCredits: number;
}): Promise<{ status: 'started'; jobId: string } | { status: 'failed'; message: string }> {
  const error = validatePaidAiStart(input, isPaidAiConfigured(process.env));
  if (error) return { status: 'failed', message: error };

  // Existing production action verifies auth and tenant before provider request.
  const result = await startMediaGenerationAction({
    kind: input.kind,
    promptText: input.prompt.trim(),
    approved: true,
    model: MINI_AI_PRICING[input.kind].model,
    ...(input.kind === 'video' ? { duration: 5, ratio: '768:1280' } : { ratio: '1080:1920' }),
  });
  if (result.status === 'started') return { status: 'started', jobId: result.id };
  return { status: 'failed', message: result.message };
}

export async function checkMiniAiJobAction(input: { kind: MiniAiKind; jobId: string }) {
  if (!isPaidAiConfigured(process.env)) {
    return { status: 'failed' as const, outputUrl: null, message: 'Генерация сейчас отключена.' };
  }
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(input.jobId)) {
    return { status: 'failed' as const, outputUrl: null, message: 'Некорректный номер задачи.' };
  }
  const result = await getMediaGenerationStatusAction(input.kind, input.jobId);
  return {
    status: result.status,
    outputUrl: result.outputUrl,
    message:
      result.status === 'failed'
        ? 'Не удалось завершить генерацию. Проверьте статус в кабинете.'
        : null,
  };
}
