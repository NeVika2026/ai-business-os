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


export type PublishingConnectionStatus = Record<PublicationChannelId, boolean>;

export async function getPublishingConnectionStatusAction(): Promise<PublishingConnectionStatus> {
  return {
    telegram: Boolean(
      process.env.TELEGRAM_BOT_TOKEN?.trim() &&
      process.env.TELEGRAM_CHAT_ID?.trim(),
    ),
    vk: Boolean(
      process.env.VK_ACCESS_TOKEN?.trim() &&
      process.env.VK_OWNER_ID?.trim(),
    ),
    dzen: false,
    youtube: false,
    tiktok: false,
    max: false,
  };
}

function splitTelegramText(value: string): string[] {
  const maxLength = 3900;
  const paragraphs = value.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph;
      continue;
    }

    const candidate = current + '\n\n' + paragraph;
    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }

    chunks.push(current);
    current = paragraph;
  }

  if (current) chunks.push(current);

  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxLength) return [chunk];

    const parts: string[] = [];
    let rest = chunk;
    while (rest.length > maxLength) {
      let cut = rest.lastIndexOf(' ', maxLength);
      if (cut < maxLength * 0.6) cut = maxLength;
      parts.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) parts.push(rest);
    return parts;
  });
}

export async function publishVariantAction(input: {
  channel: PublicationChannelId;
  title?: string;
  body: string;
  cta?: string;
}): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  if (input.channel !== 'telegram' && input.channel !== 'vk') {
    return {
      ok: false,
      message: 'Прямая публикация для этой площадки ещё не подключена.',
    };
  }

  const text = [input.title?.trim(), input.body.trim(), input.cta?.trim()]
    .filter(Boolean)
    .join('\n\n');

  if (!text) {
    return { ok: false, message: 'Нет текста для публикации.' };
  }

  if (input.channel === 'vk') {
    const accessToken = process.env.VK_ACCESS_TOKEN?.trim();
    const ownerId = process.env.VK_OWNER_ID?.trim();
    const apiVersion = process.env.VK_API_VERSION?.trim() || '5.199';

    if (!accessToken || !ownerId) {
      return {
        ok: false,
        message: 'ВКонтакте не подключён. Добавьте VK_ACCESS_TOKEN и VK_OWNER_ID в окружение проекта.',
      };
    }

    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        owner_id: ownerId,
        message: text,
        from_group: ownerId.startsWith('-') ? '1' : '0',
        v: apiVersion,
      });

      const response = await fetch('https://api.vk.com/method/wall.post', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        cache: 'no-store',
      });

      const data = (await response.json()) as {
        response?: { post_id?: number };
        error?: { error_msg?: string };
      };

      if (!response.ok || data.error || !data.response?.post_id) {
        return {
          ok: false,
          message: data.error?.error_msg || 'ВКонтакте отклонил публикацию.',
        };
      }

      return {
        ok: true,
        message: `Опубликовано во ВКонтакте. Post ID: ${data.response.post_id}.`,
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Не удалось отправить публикацию во ВКонтакте.',
      };
    }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return {
      ok: false,
      message: 'Telegram не подключён. Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в окружение проекта.',
    };
  }

  try {
    const chunks = splitTelegramText(text);

    for (const chunk of chunks) {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          disable_web_page_preview: false,
        }),
        cache: 'no-store',
      });

      const data = (await response.json()) as { ok?: boolean; description?: string };

      if (!response.ok || !data.ok) {
        return {
          ok: false,
          message: data.description || 'Telegram отклонил публикацию.',
        };
      }
    }

    return {
      ok: true,
      message: chunks.length > 1
        ? `Опубликовано в Telegram: ${chunks.length} сообщения.`
        : 'Опубликовано в Telegram.',
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Не удалось отправить публикацию в Telegram.',
    };
  }
}
