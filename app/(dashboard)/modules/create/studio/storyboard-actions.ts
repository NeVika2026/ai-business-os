
'use server';

import { randomUUID } from 'node:crypto';

import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { createClient } from '@/services/supabase/server';
import type { GatewayRequest } from '@/types/runtime/dto';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

export type StoryboardPlanScene = {
  id: string;
  order: number;
  title: string;
  durationSeconds: number;
  visualPrompt: string;
  narration: string;
  shotType: string;
  camera: string;
  lighting: string;
};

export type StoryboardPlanResult =
  | { status: 'ok'; title: string; style: string; scenes: StoryboardPlanScene[] }
  | { status: 'failed'; message: string };

export type BuildStoryboardPlanInput = {
  goal: string;
  audience?: string;
  format?: string;
  context?: string;
  durationSeconds: number;
};

function clampDuration(value: number): number {
  if (!Number.isFinite(value)) return 25;
  return Math.min(60, Math.max(5, Math.round(value)));
}

function sceneDurations(totalSeconds: number): number[] {
  const safe = clampDuration(totalSeconds);
  const count = Math.max(1, Math.min(12, Math.ceil(safe / 5)));
  const base = Math.floor(safe / count);
  let rest = safe - base * count;

  return Array.from({ length: count }, () => {
    const extra = rest > 0 ? 1 : 0;
    rest -= extra;
    return base + extra;
  });
}

function fallbackPlan(input: BuildStoryboardPlanInput): StoryboardPlanResult {
  const durations = sceneDurations(input.durationSeconds);
  const continuity = [
    'Keep the same people, room, props, wardrobe, lighting and color palette in every scene.',
    input.context && input.context.trim() ? 'Important: ' + input.context.trim() : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    status: 'ok',
    title: input.goal.trim().slice(0, 80) || 'Видео',
    style: input.context && input.context.trim()
      ? input.context.trim()
      : 'Кинематографично, цельно, реалистично',
    scenes: durations.map((durationSeconds, index) => ({
      id: randomUUID(),
      order: index + 1,
      title: 'Сцена ' + (index + 1),
      durationSeconds,
      visualPrompt:
        input.goal.trim() +
        '. ' +
        continuity +
        ' Scene ' +
        (index + 1) +
        ' of ' +
        durations.length +
        '. Vertical advertising shot, realistic perspective and cinematic light.',
      narration: index === 0 ? input.goal.trim() : '',
      shotType: index === 0 ? 'establishing' : 'medium',
      camera: index % 2 === 0 ? 'slow dolly forward' : 'slow lateral move',
      lighting: 'soft natural cinematic light',
    })),
  };
}

function extractJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw.trim().replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/i, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start < 0 || end <= start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizePlan(
  payload: Record<string, unknown>,
  input: BuildStoryboardPlanInput,
): StoryboardPlanResult {
  const durations = sceneDurations(input.durationSeconds);
  const rawScenes = Array.isArray(payload.scenes) ? payload.scenes : [];

  if (rawScenes.length === 0) return fallbackPlan(input);

  return {
    status: 'ok',
    title: asText(payload.title, input.goal.trim().slice(0, 80) || 'Видео'),
    style: asText(
      payload.style,
      input.context && input.context.trim()
        ? input.context.trim()
        : 'Кинематографично, цельно, реалистично',
    ),
    scenes: durations.map((durationSeconds, index) => {
      const raw = (rawScenes[index] || {}) as Record<string, unknown>;
      return {
        id: randomUUID(),
        order: index + 1,
        title: asText(raw.title, 'Сцена ' + (index + 1)),
        durationSeconds,
        visualPrompt: asText(
          raw.visualPrompt || raw.visual_prompt,
          input.goal.trim() + '. Сцена ' + (index + 1) + '. Единый визуальный мир.',
        ),
        narration: asText(raw.narration),
        shotType: asText(raw.shotType || raw.shot_type, 'medium'),
        camera: asText(raw.camera, 'slow dolly forward'),
        lighting: asText(raw.lighting, 'soft natural cinematic light'),
      };
    }),
  };
}

export async function buildStoryboardPlanAction(
  input: BuildStoryboardPlanInput,
): Promise<StoryboardPlanResult> {
  const goal = input.goal.trim();

  if (!goal) {
    return { status: 'failed', message: 'Сначала опишите идею ролика.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!user || !organizationId) {
    return { status: 'failed', message: 'Требуется авторизация.' };
  }

  const durationSeconds = clampDuration(input.durationSeconds);
  const count = sceneDurations(durationSeconds).length;
  const runId = randomUUID();
  const prompt = [
    'Ты режиссёр и сториборд-редактор. Собери производственную раскадровку.',
    'Цель: ' + goal,
    input.audience && input.audience.trim() ? 'Аудитория: ' + input.audience.trim() : '',
    input.format && input.format.trim() ? 'Формат: ' + input.format.trim() : '',
    input.context && input.context.trim() ? 'Ограничения и стиль: ' + input.context.trim() : '',
    'Общий хронометраж: ' + durationSeconds + ' секунд.',
    'Количество сцен: ровно ' + count + '.',
    '',
    'Критично: один визуальный мир во всех сценах. Сохраняй тех же героев, интерьер, реквизит, одежду, цвет, свет и фактуру.',
    'Каждая сцена должна быть самостоятельным промптом для видеогенератора, но логично продолжать предыдущую.',
    'Озвучка должна быть короткой и укладываться в длительность сцены.',
    'Не запускай генерацию. Верни только JSON.',
    '',
    'JSON schema:',
    '{"title":"...","style":"...","scenes":[{"title":"...","visualPrompt":"...","narration":"...","shotType":"...","camera":"...","lighting":"..."}]}',
  ]
    .filter(Boolean)
    .join('\n');

  const request: GatewayRequest = {
    scope: { organizationId, userId: user.id },
    trace: { runId, correlationId: runId, traceId: runId },
    providerCode: 'auto',
    modelCode: 'auto',
    messages: [{ role: 'user', content: prompt }],
    tools: [],
    parameters: { temperature: 0.35, maxTokens: 2400 },
    timeoutMs: 60_000,
    retryPolicy: { maxAttempts: 2, backoffMs: [500, 1500] },
  };

  try {
    const response = await aiGateway.complete(request);
    const parsed = extractJson(response.content || '');
    return parsed
      ? normalizePlan(parsed, { ...input, durationSeconds })
      : fallbackPlan({ ...input, durationSeconds });
  } catch {
    return fallbackPlan({ ...input, durationSeconds });
  }
}
