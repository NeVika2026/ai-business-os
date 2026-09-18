import { BaseToolHandler } from '@/services/runtime/tools/handlers/base-handler';
import type { ToolHandlerContext } from '@/services/runtime/tools/tool-types';

const RUNWAY_BASE_URL = 'https://api.dev.runwayml.com/v1';
const RUNWAY_VERSION = '2024-11-06';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + ' is not configured');
  return value;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

async function parseJsonResponse(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  let payload: Record<string, unknown> = {};

  if (text) {
    try {
      payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      payload = { message: text.slice(0, 500) };
    }
  }

  if (!response.ok) {
    const detail =
      asString(payload.error) ||
      asString(payload.message) ||
      asString((payload.error as Record<string, unknown> | undefined)?.message) ||
      response.statusText;
    throw new Error('Media provider request failed (' + response.status + '): ' + detail);
  }

  return payload;
}

async function runwayRequest(
  path: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const secret = requireEnv('RUNWAYML_API_SECRET');
  const response = await fetch(RUNWAY_BASE_URL + path, {
    ...init,
    signal,
    headers: {
      Authorization: 'Bearer ' + secret,
      'Content-Type': 'application/json',
      'X-Runway-Version': RUNWAY_VERSION,
      ...(init.headers ?? {}),
    },
  });
  return parseJsonResponse(response);
}

async function elevenLabsRequest(
  path: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const secret = requireEnv('ELEVENLABS_API_KEY');
  const response = await fetch(ELEVENLABS_BASE_URL + path, {
    ...init,
    signal,
    headers: {
      'xi-api-key': secret,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  return parseJsonResponse(response);
}

export class RunwayVideoGenerateHandler extends BaseToolHandler {
  async execute(args: Record<string, unknown>, ctx: ToolHandlerContext) {
    const promptText = asString(args.prompt_text);
    if (!promptText) throw new Error('prompt_text is required');

    const body: Record<string, unknown> = {
      promptText,
      model: asString(args.model) || 'gen4.5',
      ratio: asString(args.ratio) || '768:1280',
      duration: asNumber(args.duration, 5),
    };

    const imageUrl = asString(args.image_url);
    if (imageUrl) body.promptImage = imageUrl;

    const payload = await runwayRequest(
      '/image_to_video',
      { method: 'POST', body: JSON.stringify(body) },
      ctx.signal,
    );
    const taskId = asString(payload.id);
    if (!taskId) throw new Error('Runway did not return a task id');

    return { taskId, status: 'pending', kind: 'video' };
  }
}

export class RunwayImageGenerateHandler extends BaseToolHandler {
  async execute(args: Record<string, unknown>, ctx: ToolHandlerContext) {
    const promptText = asString(args.prompt_text);
    if (!promptText) throw new Error('prompt_text is required');

    const rawReferences = Array.isArray(args.reference_images)
      ? args.reference_images.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
      : [];
    const referenceImages = rawReferences.slice(0, 3).map((uri, index) => ({
      uri: uri.trim(),
      tag: index === 0 ? 'reference' : 'reference' + String(index + 1),
    }));

    const payload = await runwayRequest(
      '/text_to_image',
      {
        method: 'POST',
        body: JSON.stringify({
          promptText: referenceImages.length
            ? '@reference is the primary subject/reference image. ' + promptText
            : promptText,
          model: asString(args.model) || 'gen4_image',
          ratio: asString(args.ratio) || '1080:1920',
          outputCount: Math.min(4, Math.max(1, asNumber(args.output_count, 1))),
          ...(referenceImages.length ? { referenceImages } : {}),
        }),
      },
      ctx.signal,
    );
    const taskId = asString(payload.id);
    if (!taskId) throw new Error('Runway did not return a task id');

    return { taskId, status: 'pending', kind: 'image' };
  }
}

export class RunwayTaskStatusHandler extends BaseToolHandler {
  async execute(args: Record<string, unknown>, ctx: ToolHandlerContext) {
    const taskId = asString(args.task_id);
    if (!taskId) throw new Error('task_id is required');

    const payload = await runwayRequest('/tasks/' + encodeURIComponent(taskId), { method: 'GET' }, ctx.signal);
    const output = Array.isArray(payload.output)
      ? payload.output.filter((item): item is string => typeof item === 'string')
      : [];

    return {
      taskId,
      status: asString(payload.status) || 'UNKNOWN',
      assetUrls: output,
      ephemeral: output.length > 0,
      note:
        output.length > 0
          ? 'Provider output URLs expire. Persist the asset before publishing.'
          : null,
    };
  }
}

export class ElevenLabsVoiceListHandler extends BaseToolHandler {
  async execute(args: Record<string, unknown>, ctx: ToolHandlerContext) {
    const limit = Math.min(30, Math.max(1, asNumber(args.limit, 12)));
    const search = asString(args.search);
    const params = new URLSearchParams({ page_size: String(limit), include_total_count: 'false' });
    if (search) params.set('search', search);

    const payload = await elevenLabsRequest('/v2/voices?' + params.toString(), { method: 'GET' }, ctx.signal);
    const voices = Array.isArray(payload.voices)
      ? payload.voices.slice(0, limit).map((item) => {
          const voice = item as Record<string, unknown>;
          return {
            id: asString(voice.voice_id),
            name: asString(voice.name),
            category: asString(voice.category),
            previewUrl: asString(voice.preview_url) || null,
          };
        })
      : [];

    return { voices, count: voices.length };
  }
}

export class ElevenLabsVoiceGenerateHandler extends BaseToolHandler {
  async execute(args: Record<string, unknown>, ctx: ToolHandlerContext) {
    const text = asString(args.text);
    const voiceId = asString(args.voice_id);
    if (!text || !voiceId) throw new Error('text and voice_id are required');

    const payload = await elevenLabsRequest(
      '/v1/flows/text-to-speech',
      {
        method: 'POST',
        body: JSON.stringify({
          model_id: asString(args.model_id) || 'eleven_multilingual_v2',
          text,
          voice: voiceId,
        }),
      },
      ctx.signal,
    );

    const generationId = asString(payload.id);
    if (!generationId) throw new Error('ElevenLabs did not return a generation id');

    return {
      generationId,
      status: asString(payload.status) || 'pending',
      kind: 'voice',
    };
  }
}

function extractVoiceOutputUrl(payload: Record<string, unknown>): string | null {
  const direct =
    asString(payload.output_url) ||
    asString(payload.url) ||
    asString((payload.output as Record<string, unknown> | undefined)?.url);
  return direct || null;
}

export class ElevenLabsVoiceStatusHandler extends BaseToolHandler {
  async execute(args: Record<string, unknown>, ctx: ToolHandlerContext) {
    const generationId = asString(args.generation_id);
    if (!generationId) throw new Error('generation_id is required');

    const payload = await elevenLabsRequest(
      '/v1/flows/text-to-speech/' + encodeURIComponent(generationId),
      { method: 'GET' },
      ctx.signal,
    );

    return {
      generationId,
      status: asString(payload.status) || 'unknown',
      outputUrl: extractVoiceOutputUrl(payload),
    };
  }
}

export const runwayVideoGenerateHandler = new RunwayVideoGenerateHandler();
export const runwayImageGenerateHandler = new RunwayImageGenerateHandler();
export const runwayTaskStatusHandler = new RunwayTaskStatusHandler();
export const elevenLabsVoiceListHandler = new ElevenLabsVoiceListHandler();
export const elevenLabsVoiceGenerateHandler = new ElevenLabsVoiceGenerateHandler();
export const elevenLabsVoiceStatusHandler = new ElevenLabsVoiceStatusHandler();
