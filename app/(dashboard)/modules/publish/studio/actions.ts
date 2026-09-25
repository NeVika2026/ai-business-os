'use server';

import { randomUUID } from 'node:crypto';

import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { createClient } from '@/services/supabase/server';
import type { GatewayRequest } from '@/types/runtime/dto';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { getDashboardContext } from '@/utils/auth/onboarding';
import { ensureFactoryProject, saveFactoryArtifact } from '@/lib/factory-chain/persistence';
import { loadProjectMemory } from '@/lib/projects/project-memory';

export type PublicationChannelId =
  | 'telegram'
  | 'vk'
  | 'dzen'
  | 'youtube'
  | 'instagram'
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
  | { status: 'completed'; projectId: string; variants: PublicationVariant[] }
  | { status: 'failed'; message: string };

const CHANNEL_NAMES: Record<PublicationChannelId, string> = {
  telegram: 'Telegram',
  vk: 'ВКонтакте',
  dzen: 'Дзен',
  youtube: 'YouTube',
  instagram: 'Instagram Reels',
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
  projectId?: string | null;
}): Promise<PublicationPackResult> {
  const source = input.source.trim();
  const channels = Array.from(new Set(input.channels));

  if (!source) {
    return { status: 'failed', message: 'Добавьте материал, который нужно опубликовать.' };
  }

  if (!channels.length) {
    return { status: 'failed', message: 'Выберите хотя бы одну площадку.' };
  }

  const project = await ensureFactoryProject({
    projectId: input.projectId,
    seed: input.goal?.trim() || source.slice(0, 240),
    stage: 'publish',
  });

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

  const memory = await loadProjectMemory(
    project.identity.supabase,
    project.identity.organizationId,
    project.projectId,
  );
  const memoryContext = [
    memory.goals ? 'Цели проекта: ' + memory.goals : '',
    memory.audience ? 'Аудитория проекта: ' + memory.audience : '',
    memory.style ? 'Стиль проекта: ' + memory.style : '',
    memory.decisions ? 'Принятые решения: ' + memory.decisions : '',
    memory.constraints ? 'Не делать / ограничения: ' + memory.constraints : '',
  ].filter(Boolean).join('\n');

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
    memoryContext ? 'ПАМЯТЬ ПРОЕКТА:\n' + memoryContext : '',
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
    '- Instagram: короткая подпись к Reels с сильным хуком и естественным CTA;',
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

    const packText = variants
      .map((variant) =>
        [
          CHANNEL_NAMES[variant.channel],
          variant.title,
          variant.body,
          variant.cta ? 'CTA: ' + variant.cta : '',
        ]
          .filter(Boolean)
          .join('\n'),
      )
      .join('\n\n---\n\n');

    await saveFactoryArtifact({
      projectId: project.projectId,
      stage: 'publish',
      title: 'Пакет публикаций',
      content: packText,
      metadata: {
        channels,
        variants,
      },
      identity: project.identity,
    });

    return { status: 'completed', projectId: project.projectId, variants };
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
    youtube: Boolean(
      process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() &&
      process.env.YOUTUBE_REFRESH_TOKEN?.trim(),
    ),
    instagram: Boolean(
      process.env.INSTAGRAM_USER_ID?.trim() &&
      process.env.INSTAGRAM_ACCESS_TOKEN?.trim(),
    ),
    tiktok: Boolean(
      process.env.TIKTOK_CLIENT_KEY?.trim() &&
      process.env.TIKTOK_CLIENT_SECRET?.trim() &&
      process.env.TIKTOK_REFRESH_TOKEN?.trim(),
    ),
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


async function ensureDirectPublishingAccess() {
  const supabase = await createClient();
  const context = await getDashboardContext(supabase);

  if (!context) {
    return { ok: false as const, message: 'Требуется авторизация.' };
  }

  if (context.role === 'member') {
    return {
      ok: false as const,
      message: 'Прямая публикация доступна владельцу и администраторам организации.',
    };
  }

  return { ok: true as const, context };
}

async function vkApiCall<T>(
  method: string,
  params: Record<string, string>,
  accessToken: string,
  apiVersion: string,
): Promise<T> {
  const body = new URLSearchParams({
    ...params,
    access_token: accessToken,
    v: apiVersion,
  });

  const response = await fetch('https://api.vk.com/method/' + method, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  });

  const data = (await response.json()) as {
    response?: T;
    error?: { error_msg?: string };
  };

  if (!response.ok || data.error || data.response === undefined) {
    throw new Error(data.error?.error_msg || 'ВКонтакте отклонил запрос.');
  }

  return data.response;
}

async function uploadVkWallPhoto(input: {
  sourceUrl: string;
  ownerId: string;
  accessToken: string;
  apiVersion: string;
}): Promise<string> {
  const groupId = input.ownerId.startsWith('-')
    ? input.ownerId.slice(1)
    : '';

  const uploadServer = await vkApiCall<{ upload_url?: string }>(
    'photos.getWallUploadServer',
    groupId ? { group_id: groupId } : {},
    input.accessToken,
    input.apiVersion,
  );

  if (!uploadServer.upload_url) {
    throw new Error('ВКонтакте не вернул сервер загрузки изображения.');
  }

  const sourceResponse = await fetch(input.sourceUrl, { cache: 'no-store' });
  if (!sourceResponse.ok) {
    throw new Error('Не удалось скачать изображение для ВКонтакте.');
  }

  const contentType = sourceResponse.headers.get('content-type') || 'image/jpeg';
  const bytes = await sourceResponse.arrayBuffer();
  const form = new FormData();
  form.append('photo', new Blob([bytes], { type: contentType }), 'publication.jpg');

  const uploadResponse = await fetch(uploadServer.upload_url, {
    method: 'POST',
    body: form,
    cache: 'no-store',
  });

  const uploaded = (await uploadResponse.json()) as {
    server?: number | string;
    photo?: string;
    hash?: string;
  };

  if (!uploadResponse.ok || uploaded.server === undefined || !uploaded.photo || !uploaded.hash) {
    throw new Error('ВКонтакте не принял изображение.');
  }

  const saved = await vkApiCall<Array<{
    id?: number;
    owner_id?: number;
    access_key?: string;
  }>>(
    'photos.saveWallPhoto',
    {
      server: String(uploaded.server),
      photo: uploaded.photo,
      hash: uploaded.hash,
      ...(groupId ? { group_id: groupId } : {}),
    },
    input.accessToken,
    input.apiVersion,
  );

  const photo = saved[0];
  if (!photo?.id || !photo.owner_id) {
    throw new Error('Не удалось сохранить изображение во ВКонтакте.');
  }

  return 'photo' + String(photo.owner_id) + '_' + String(photo.id) +
    (photo.access_key ? '_' + photo.access_key : '');
}


async function getYouTubeAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('YouTube не подключён. Нужны Google OAuth client ID, client secret и refresh token.');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  });

  const data = (await response.json()) as {
    access_token?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || 'Не удалось обновить доступ YouTube.');
  }

  return data.access_token;
}

async function publishYouTubeVideo(input: {
  mediaUrl: string;
  title: string;
  description: string;
}): Promise<string> {
  const accessToken = await getYouTubeAccessToken();
  const source = await fetch(input.mediaUrl, { cache: 'no-store' });

  if (!source.ok) {
    throw new Error('Не удалось скачать видео из Медиатеки для YouTube.');
  }

  const contentType = source.headers.get('content-type') || 'video/mp4';
  if (!contentType.startsWith('video/')) {
    throw new Error('Для YouTube нужно выбрать видео.');
  }

  const bytes = await source.arrayBuffer();
  const maxBytes = 100 * 1024 * 1024;

  if (bytes.byteLength > maxBytes) {
    throw new Error('Для прямой публикации из Бизнес-завода видео должно быть не больше 100 МБ.');
  }

  const privacyRaw = process.env.YOUTUBE_PRIVACY_STATUS?.trim().toLowerCase();
  const privacyStatus =
    privacyRaw === 'public' || privacyRaw === 'private' || privacyRaw === 'unlisted'
      ? privacyRaw
      : 'unlisted';

  const metadata = {
    snippet: {
      title: input.title.slice(0, 100) || 'Видео Бизнес-завода',
      description: input.description.slice(0, 5000),
      categoryId: '22',
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: false,
    },
  };

  const initResponse = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(bytes.byteLength),
        'X-Upload-Content-Type': contentType,
      },
      body: JSON.stringify(metadata),
      cache: 'no-store',
    },
  );

  if (!initResponse.ok) {
    const detail = (await initResponse.text()).slice(0, 700);
    throw new Error('YouTube не создал сессию загрузки: ' + (detail || initResponse.statusText));
  }

  const uploadUrl = initResponse.headers.get('location');
  if (!uploadUrl) {
    throw new Error('YouTube не вернул адрес загрузки.');
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(bytes.byteLength),
    },
    body: bytes,
    cache: 'no-store',
  });

  const data = (await uploadResponse.json()) as {
    id?: string;
    error?: { message?: string };
  };

  if (!uploadResponse.ok || !data.id) {
    throw new Error(data.error?.message || 'YouTube отклонил загрузку видео.');
  }

  return data.id;
}



function instagramGraphVersion(): string {
  return process.env.META_GRAPH_API_VERSION?.trim() || 'v24.0';
}

async function instagramGraphRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST';
    params?: Record<string, string>;
  } = {},
): Promise<T> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new Error('Instagram не подключён. Нужен access token профессионального аккаунта.');
  }

  const url = new URL(
    'https://graph.facebook.com/' +
      instagramGraphVersion() +
      '/' +
      path.replace(/^\//, ''),
  );
  for (const [key, value] of Object.entries(options.params ?? {})) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    cache: 'no-store',
  });

  const data = (await response.json()) as T & {
    error?: { message?: string; code?: number };
  };

  if (!response.ok || data.error) {
    throw new Error(
      data.error?.message || 'Instagram отклонил запрос.',
    );
  }

  return data;
}

async function publishInstagramReel(input: {
  mediaUrl: string;
  caption: string;
}): Promise<{ mediaId: string; containerId: string }> {
  const igUserId = process.env.INSTAGRAM_USER_ID?.trim();
  if (!igUserId) {
    throw new Error('Instagram не подключён. Нужен ID профессионального Instagram-аккаунта.');
  }

  const created = await instagramGraphRequest<{ id?: string }>(igUserId + '/media', {
    method: 'POST',
    params: {
      media_type: 'REELS',
      video_url: input.mediaUrl,
      caption: input.caption.slice(0, 2200),
      share_to_feed: 'true',
    },
  });

  if (!created.id) {
    throw new Error('Instagram не вернул ID контейнера Reels.');
  }

  let finished = false;
  let lastStatus = '';

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const status = await instagramGraphRequest<{
      status_code?: string;
      status?: string;
    }>(created.id, {
      params: { fields: 'status_code,status' },
    });

    lastStatus = status.status_code || status.status || '';

    if (status.status_code === 'FINISHED') {
      finished = true;
      break;
    }

    if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
      throw new Error(
        'Instagram не подготовил Reels: ' + (status.status || status.status_code),
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (!finished) {
    throw new Error(
      'Instagram ещё обрабатывает видео. Последний статус: ' +
        (lastStatus || 'IN_PROGRESS') +
        '. Повторите публикацию позже.',
    );
  }

  const published = await instagramGraphRequest<{ id?: string }>(
    igUserId + '/media_publish',
    {
      method: 'POST',
      params: { creation_id: created.id },
    },
  );

  if (!published.id) {
    throw new Error('Instagram не вернул ID опубликованного Reels.');
  }

  return {
    mediaId: published.id,
    containerId: created.id,
  };
}

type TikTokCreatorInfo = {
  username: string;
  nickname: string;
  avatarUrl: string;
  privacyLevels: string[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxDurationSeconds: number | null;
};

async function getTikTokAccessToken(): Promise<string> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
  const refreshToken = process.env.TIKTOK_REFRESH_TOKEN?.trim();

  if (!clientKey || !clientSecret || !refreshToken) {
    throw new Error('TikTok не подключён. Нужны Client Key, Client Secret и Refresh Token.');
  }

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  });

  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        'Не удалось обновить доступ TikTok.',
    );
  }

  return data.access_token;
}

async function loadTikTokCreatorInfo(accessToken: string): Promise<TikTokCreatorInfo> {
  const response = await fetch(
    'https://open.tiktokapis.com/v2/post/publish/creator_info/query/',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      cache: 'no-store',
    },
  );

  const payload = (await response.json()) as {
    data?: {
      creator_username?: string;
      creator_nickname?: string;
      creator_avatar_url?: string;
      privacy_level_options?: string[];
      comment_disabled?: boolean;
      duet_disabled?: boolean;
      stitch_disabled?: boolean;
      max_video_post_duration_sec?: number;
    };
    error?: { code?: string; message?: string };
  };

  if (
    !response.ok ||
    payload.error?.code && payload.error.code !== 'ok' ||
    !payload.data
  ) {
    throw new Error(
      payload.error?.message || 'TikTok не вернул данные аккаунта.',
    );
  }

  return {
    username: payload.data.creator_username ?? '',
    nickname: payload.data.creator_nickname ?? '',
    avatarUrl: payload.data.creator_avatar_url ?? '',
    privacyLevels: payload.data.privacy_level_options ?? [],
    commentDisabled: Boolean(payload.data.comment_disabled),
    duetDisabled: Boolean(payload.data.duet_disabled),
    stitchDisabled: Boolean(payload.data.stitch_disabled),
    maxDurationSeconds:
      typeof payload.data.max_video_post_duration_sec === 'number'
        ? payload.data.max_video_post_duration_sec
        : null,
  };
}

export async function getTikTokCreatorInfoAction(): Promise<
  | { ok: true; creator: TikTokCreatorInfo }
  | { ok: false; message: string }
> {
  const access = await ensureDirectPublishingAccess();
  if (!access.ok) {
    return { ok: false, message: access.message };
  }

  try {
    const token = await getTikTokAccessToken();
    const creator = await loadTikTokCreatorInfo(token);
    return { ok: true, creator };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : 'Не удалось получить данные TikTok.',
    };
  }
}

async function publishTikTokVideo(input: {
  mediaUrl: string;
  caption: string;
  privacyLevel?: string | null;
}): Promise<{ publishId: string; privacyLevel: string }> {
  const accessToken = await getTikTokAccessToken();
  const creator = await loadTikTokCreatorInfo(accessToken);

  const source = await fetch(input.mediaUrl, { cache: 'no-store' });
  if (!source.ok) {
    throw new Error('Не удалось скачать видео из Медиатеки для TikTok.');
  }

  const contentType = source.headers.get('content-type') || 'video/mp4';
  if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(contentType)) {
    throw new Error('TikTok принимает MP4, MOV или WebM.');
  }

  const bytes = await source.arrayBuffer();
  const maxBytes = 64 * 1024 * 1024;

  if (bytes.byteLength > maxBytes) {
    throw new Error(
      'Для прямой публикации в TikTok видео должно быть не больше 64 МБ.',
    );
  }

  if (bytes.byteLength < 1) {
    throw new Error('Видео для TikTok пустое.');
  }

  const requestedPrivacy = input.privacyLevel?.trim() || '';
  const privacyLevel = creator.privacyLevels.includes(requestedPrivacy)
    ? requestedPrivacy
    : creator.privacyLevels.includes('SELF_ONLY')
      ? 'SELF_ONLY'
      : creator.privacyLevels[0];

  if (!privacyLevel) {
    throw new Error('TikTok не вернул доступный уровень приватности.');
  }

  const initResponse = await fetch(
    'https://open.tiktokapis.com/v2/post/publish/video/init/',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: input.caption.slice(0, 2200),
          privacy_level: privacyLevel,
          disable_duet: creator.duetDisabled,
          disable_comment: creator.commentDisabled,
          disable_stitch: creator.stitchDisabled,
          video_cover_timestamp_ms: 1000,
          is_aigc: true,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: bytes.byteLength,
          chunk_size: bytes.byteLength,
          total_chunk_count: 1,
        },
      }),
      cache: 'no-store',
    },
  );

  const initialized = (await initResponse.json()) as {
    data?: { publish_id?: string; upload_url?: string };
    error?: { code?: string; message?: string };
  };

  if (
    !initResponse.ok ||
    initialized.error?.code && initialized.error.code !== 'ok' ||
    !initialized.data?.publish_id ||
    !initialized.data?.upload_url
  ) {
    throw new Error(
      initialized.error?.message || 'TikTok не создал сессию публикации.',
    );
  }

  const uploadResponse = await fetch(initialized.data.upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(bytes.byteLength),
      'Content-Range':
        'bytes 0-' + String(bytes.byteLength - 1) + '/' + String(bytes.byteLength),
    },
    body: bytes,
    cache: 'no-store',
  });

  if (!uploadResponse.ok) {
    const detail = (await uploadResponse.text()).slice(0, 500);
    throw new Error(
      'TikTok отклонил загрузку видео: ' +
        (detail || uploadResponse.statusText),
    );
  }

  return {
    publishId: initialized.data.publish_id,
    privacyLevel,
  };
}

export async function publishVariantAction(input: {
  channel: PublicationChannelId;
  title?: string;
  body: string;
  cta?: string;
  projectId?: string | null;
  mediaUrl?: string | null;
  mediaKind?: 'image' | 'video' | 'audio' | null;
  tiktokPrivacyLevel?: string | null;
}): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const access = await ensureDirectPublishingAccess();
  if (!access.ok) {
    return { ok: false, message: access.message };
  }

  if (
    input.channel !== 'telegram' &&
    input.channel !== 'vk' &&
    input.channel !== 'youtube' &&
    input.channel !== 'instagram' &&
    input.channel !== 'tiktok'
  ) {
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

  if (input.channel === 'youtube') {
    const mediaUrl = input.mediaUrl?.trim() || '';
    if (!mediaUrl || input.mediaKind !== 'video') {
      return {
        ok: false,
        message: 'Для прямой публикации в YouTube выберите готовое видео.',
      };
    }

    try {
      const videoId = await publishYouTubeVideo({
        mediaUrl,
        title: input.title?.trim() || 'Видео Бизнес-завода',
        description: [input.body.trim(), input.cta?.trim()].filter(Boolean).join('\n\n'),
      });

      if (input.projectId) {
        await saveFactoryArtifact({
          projectId: input.projectId,
          stage: 'publish',
          title: 'Опубликовано в YouTube',
          content: text,
          metadata: {
            channel: 'youtube',
            videoId,
            published: true,
            mediaKind: 'video',
            mediaUrl,
          },
        });
      }

      return {
        ok: true,
        message: 'Видео отправлено в YouTube. Video ID: ' + videoId + '.',
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Не удалось опубликовать видео в YouTube.',
      };
    }
  }

  if (input.channel === 'instagram') {
    const mediaUrl = input.mediaUrl?.trim() || '';
    if (!mediaUrl || input.mediaKind !== 'video') {
      return {
        ok: false,
        message: 'Для публикации Reels выберите готовое видео.',
      };
    }

    try {
      const result = await publishInstagramReel({
        mediaUrl,
        caption: [input.title?.trim(), input.body.trim(), input.cta?.trim()]
          .filter(Boolean)
          .join('\n\n'),
      });

      if (input.projectId) {
        await saveFactoryArtifact({
          projectId: input.projectId,
          stage: 'publish',
          title: 'Опубликовано в Instagram Reels',
          content: text,
          metadata: {
            channel: 'instagram',
            mediaId: result.mediaId,
            containerId: result.containerId,
            published: true,
            mediaKind: 'video',
            mediaUrl,
          },
        });
      }

      return {
        ok: true,
        message: 'Reels опубликован в Instagram. Media ID: ' + result.mediaId + '.',
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Не удалось опубликовать Reels в Instagram.',
      };
    }
  }

  if (input.channel === 'tiktok') {
    const mediaUrl = input.mediaUrl?.trim() || '';
    if (!mediaUrl || input.mediaKind !== 'video') {
      return {
        ok: false,
        message: 'Для прямой публикации в TikTok выберите готовое видео.',
      };
    }

    try {
      const result = await publishTikTokVideo({
        mediaUrl,
        caption: [input.title?.trim(), input.body.trim(), input.cta?.trim()]
          .filter(Boolean)
          .join('\n\n'),
        privacyLevel: input.tiktokPrivacyLevel,
      });

      if (input.projectId) {
        await saveFactoryArtifact({
          projectId: input.projectId,
          stage: 'publish',
          title: 'Отправлено в TikTok',
          content: text,
          metadata: {
            channel: 'tiktok',
            publishId: result.publishId,
            privacyLevel: result.privacyLevel,
            published: true,
            mediaKind: 'video',
            mediaUrl,
            aiGenerated: true,
          },
        });
      }

      return {
        ok: true,
        message:
          'Видео передано в TikTok. Publish ID: ' +
          result.publishId +
          '. Приватность: ' +
          result.privacyLevel +
          '.',
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Не удалось отправить видео в TikTok.',
      };
    }
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
      let attachment = '';
      const mediaUrl = input.mediaUrl?.trim() || '';
      const mediaKind = input.mediaKind ?? null;

      if (mediaUrl && mediaKind === 'image') {
        attachment = await uploadVkWallPhoto({
          sourceUrl: mediaUrl,
          ownerId,
          accessToken,
          apiVersion,
        });
      }

      const result = await vkApiCall<{ post_id?: number }>(
        'wall.post',
        {
          owner_id: ownerId,
          message: text,
          from_group: ownerId.startsWith('-') ? '1' : '0',
          ...(attachment ? { attachments: attachment } : {}),
        },
        accessToken,
        apiVersion,
      );

      if (!result.post_id) {
        return {
          ok: false,
          message: 'ВКонтакте не вернул ID публикации.',
        };
      }

      if (input.projectId) {
        await saveFactoryArtifact({
          projectId: input.projectId,
          stage: 'publish',
          title: 'Опубликовано во ВКонтакте',
          content: text,
          metadata: {
            channel: 'vk',
            postId: result.post_id,
            published: true,
            mediaPublished: Boolean(attachment),
            mediaKind: attachment ? 'image' : null,
            mediaUrl: attachment ? mediaUrl : null,
          },
        });
      }

      return {
        ok: true,
        message: attachment
          ? `Опубликовано во ВКонтакте с изображением. Post ID: ${result.post_id}.`
          : `Опубликовано во ВКонтакте. Post ID: ${result.post_id}.`,
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
    const mediaUrl = input.mediaUrl?.trim() || '';
    const mediaKind = input.mediaKind ?? null;
    let sentMessages = 0;
    let mediaPublished = false;
    let remainingText = text;

    if (mediaUrl && mediaKind) {
      const captionLimit = 900;
      let caption = remainingText;

      if (caption.length > captionLimit) {
        let cut = caption.lastIndexOf(' ', captionLimit);
        if (cut < captionLimit * 0.6) cut = captionLimit;
        caption = caption.slice(0, cut).trim();
        remainingText = remainingText.slice(cut).trim();
      } else {
        remainingText = '';
      }

      const endpoint =
        mediaKind === 'image'
          ? 'sendPhoto'
          : mediaKind === 'video'
            ? 'sendVideo'
            : 'sendAudio';
      const mediaField =
        mediaKind === 'image'
          ? 'photo'
          : mediaKind === 'video'
            ? 'video'
            : 'audio';

      const response = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          [mediaField]: mediaUrl,
          ...(caption ? { caption } : {}),
        }),
        cache: 'no-store',
      });

      const data = (await response.json()) as { ok?: boolean; description?: string };

      if (!response.ok || !data.ok) {
        return {
          ok: false,
          message: data.description || 'Telegram отклонил медиа-публикацию.',
        };
      }

      mediaPublished = true;
      sentMessages += 1;
    }

    const chunks = remainingText ? splitTelegramText(remainingText) : [];

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

      sentMessages += 1;
    }

    if (input.projectId) {
      await saveFactoryArtifact({
        projectId: input.projectId,
        stage: 'publish',
        title: 'Опубликовано в Telegram',
        content: text,
        metadata: {
          channel: 'telegram',
          chunks: sentMessages,
          published: true,
          mediaPublished,
          mediaKind,
          mediaUrl: mediaUrl || null,
        },
      });
    }

    return {
      ok: true,
      message: mediaPublished
        ? sentMessages > 1
          ? `Опубликовано в Telegram: медиа + ${sentMessages - 1} текстовых сообщения.`
          : 'Опубликовано в Telegram с медиа.'
        : sentMessages > 1
          ? `Опубликовано в Telegram: ${sentMessages} сообщения.`
          : 'Опубликовано в Telegram.',
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Не удалось отправить публикацию в Telegram.',
    };
  }
}
