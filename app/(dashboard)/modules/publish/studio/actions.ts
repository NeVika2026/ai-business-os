'use server';

import { randomUUID } from 'node:crypto';

import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { createClient } from '@/services/supabase/server';
import type { GatewayRequest } from '@/types/runtime/dto';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

export type PublicationChannelId =
  | 'telegram'
  | 'vk'
  | 'dzen'
  | 'youtube'
  | 'tiktok'
  | 'max';

export type PublicationVariant = {
  channel: PublicationChannelId;
  title: string;
  body: string;
  cta: string;
  notes: string;
};

export type PublicationPackResult =
  | { status: 'completed'; variants: PublicationVariant[] }
  | { status: 'failed'; message: string };

const CHANNEL_NAMES: Record<PublicationChannelId, string> = {
  telegram: 'Telegram',
  vk: 'ВКонтакте',
  dzen: 'Дзен',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  max: 'MAX',
};

function stripCodeFence(value: string): string {
  return value
    .trim()
    .replace(/^\`\`\`(?:json)?\s*/i, '')
    .replace(/\s*\`\`\`$/, '')
    .trim();
}

function parseVariants(
  raw: string,
  channels: PublicationChannelId[],
): PublicationVariant[] | null {
  try {
    const parsed = JSON.parse(stripCodeFence(raw)) as Record<
      string,
      { title?: unknown; body?: unknown; cta?: unknown; notes?: unknown }
    >;

    return channels.map((channel) => {
      const item = parsed[channel] ?? {};
      return {
        channel,
        title: typeof item.title === 'string' ? item.title.trim() : '',
        body: typeof item.body === 'string' ? item.body.trim() : '',
        cta: typeof item.cta === 'string' ? item.cta.trim() : '',
        notes: typeof item.notes === 'string' ? item.notes.trim() : '',
      };
    });
  } catch {
    return null;
  }
}

export async function buildPublicationPackAction(input: {
  source: string;
  channels: PublicationChannelId[];
  goal?: string;
  callToAction?: string;
}): Promise<PublicationPackResult> {
  const source = input.source.trim();
  const channels = Array.from(new Set(input.channels));

  if (!source) {
    return { status: 'failed', message: 'Добавьте материал, который нужно опубликовать.' };
  }

  if (!channels.length) {
    return { status: 'failed', message: 'Выберите хотя бы одну площадку.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: 'failed', message: 'Требуется авторизация.' };
  }

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) {
    return { status: 'failed', message: 'Организация не найдена.' };
  }

  const runId = randomUUID();
  const channelInstructions = channels
    .map((channel) => `- ${channel}: адаптация под ${CHANNEL_NAMES[channel]}`)
    .join('\n');

  const prompt = [
    'Ты — редактор публикационного цеха Бизнес-Завода.',
    'Нужно адаптировать один исходный материал под выбранные площадки.',
    '',
    'ИСХОДНЫЙ МАТЕРИАЛ:',
    source,
    '',
    input.goal?.trim() ? 'Цель публикации: ' + input.goal.trim() : '',
    input.callToAction?.trim() ? 'Желаемый CTA: ' + input.callToAction.trim() : '',
    '',
    'ПЛОЩАДКИ:',
    channelInstructions,
    '',
    'Правила:',
    '- сохраняй факты исходника и не придумывай новые цифры, обещания, отзывы или достижения;',
    '- Telegram: живой пост, читаемые абзацы, без перегруза хэштегами;',
    '- ВКонтакте: пост для ленты, сильное начало и понятный CTA;',
    '- Дзен: заголовок + более развернутая подача, пригодная для публикации;',
    '- YouTube: заголовок и описание к ролику/Shorts, если исходник видеоформатный;',
    '- TikTok: короткая подпись с хуком и CTA, без канцелярщины;',
    '- MAX: компактный пост для канала/ленты;',
    '- notes — короткая редакторская пометка по формату или медиа, не инструкция пользователю;',
    '',
    'Верни ТОЛЬКО JSON-объект без markdown. Ключи — id площадок.',
    'Для каждого ключа структура строго: {"title":"...","body":"...","cta":"...","notes":"..."}.',
  ]
    .filter(Boolean)
    .join('\n');

  const request: GatewayRequest = {
    scope: {
      organizationId,
      userId: user.id,
    },
    trace: {
      runId,
      traceId: runId,
      correlationId: runId,
    },
    providerCode: 'auto',
    modelCode: 'auto',
    messages: [{ role: 'user', content: prompt }],
    tools: [],
    parameters: {
      temperature: 0.35,
      maxTokens: Math.min(4200, 900 + channels.length * 500),
    },
    timeoutMs: 45_000,
    retryPolicy: {
      maxAttempts: 2,
      backoffMs: [700, 1400],
    },
    routing: {
      intent: 'publication_pack',
      taskCategory: 'creative',
      estimatedContextLength: source.length,
      reasoningComplexity: 'medium',
      latencyTarget: 'balanced',
      costTarget: 'balanced',
      toolUsage: false,
    },
  };

  try {
    const response = await aiGateway.complete(request);
    const variants = parseVariants(response.content ?? '', channels);

    if (!variants) {
      return {
        status: 'failed',
        message: 'OSA получила ответ, но не смогла разобрать пакет публикаций. Повторите запуск.',
      };
    }

    return { status: 'completed', variants };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Не удалось собрать публикации.',
    };
  }
}
