'use server';

import { randomUUID } from 'node:crypto';

import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { createProductionToolRegistry } from '@/services/runtime/tools/tool-registry';
import { createToolExecutor } from '@/services/runtime/tools/executor/tool-executor-factory';
import {
  persistProviderAsset,
  refreshPersistedMediaUrl,
} from '@/services/media/persist-provider-asset';

export type MediaStudioKind = 'video' | 'image' | 'voice';

export type MediaStudioStartInput = {
  kind: MediaStudioKind;
  promptText: string;
  approved: boolean;
  ratio?: string;
  duration?: number;
  imageUrl?: string;
  voiceId?: string;
};

export type MediaStudioActionResult =
  | { status: 'started'; id: string; kind: MediaStudioKind }
  | { status: 'approval_required'; message: string }
  | { status: 'failed'; message: string };

export type MediaStudioStatusResult =
  | {
      status: 'pending' | 'running' | 'completed' | 'failed';
      providerStatus: string;
      outputUrl: string | null;
      outputUrls: string[];
      ephemeral: boolean;
      persisted?: boolean;
      storagePath?: string | null;
    }
  | {
      status: 'failed';
      providerStatus: string;
      outputUrl: null;
      outputUrls: [];
      ephemeral: false;
      persisted?: false;
      storagePath?: null;
    };

async function resolveMediaExecutionIdentity() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Требуется авторизация.');
  }

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) {
    throw new Error('Организация не найдена.');
  }

  return {
    organizationId,
    userId: user.id,
    employeeId: user.id,
  };
}

function normalizeRunwayStatus(status: string): MediaStudioStatusResult['status'] {
  const normalized = status.toUpperCase();
  if (normalized === 'SUCCEEDED') return 'completed';
  if (normalized === 'FAILED' || normalized === 'CANCELLED') return 'failed';
  if (normalized === 'RUNNING' || normalized === 'THROTTLED') return 'running';
  return 'pending';
}

function normalizeVoiceStatus(status: string): MediaStudioStatusResult['status'] {
  const normalized = status.toLowerCase();
  if (normalized === 'completed') return 'completed';
  if (normalized === 'failed') return 'failed';
  if (normalized === 'generating') return 'running';
  return 'pending';
}

async function executeMediaTool(
  toolId: string,
  args: Record<string, unknown>,
  options?: { alreadyApproved?: boolean },
) {
  const identity = await resolveMediaExecutionIdentity();
  const registry = createProductionToolRegistry();
  const executor = createToolExecutor(registry);
  const runId = randomUUID();
  const tool = registry.get(toolId);

  if (!tool) {
    throw new Error('Медиа-инструмент недоступен.');
  }

  return executor.execute({
    call: {
      id: randomUUID(),
      name: toolId,
      arguments: args,
      audit: {
        runId,
        employeeId: identity.employeeId,
        organizationId: identity.organizationId,
        requestedAt: new Date().toISOString(),
      },
    },
    scope: {
      organizationId: identity.organizationId,
      userId: identity.userId,
    },
    trace: {
      runId,
      correlationId: runId,
      traceId: runId,
    },
    employee: {
      id: identity.employeeId,
      roleTitle: 'Creator',
      permissions: { can_use_media_tools: true },
      enabledTools: [toolId],
    },
    category: tool.category,
    toolPermissions: tool.permissions,
    approvalPolicy: tool.approvalPolicy,
    alreadyApproved: options?.alreadyApproved,
    requestMetadata: { source: 'create-studio', explicitUserAction: true },
  });
}

export async function listMediaVoicesAction(): Promise<
  Array<{ id: string; name: string; category: string; previewUrl: string | null }>
> {
  const result = await executeMediaTool('media.voice.list', { limit: 20 });

  if (!result.success || !result.output) {
    return [];
  }

  const voices = (result.output as { voices?: unknown }).voices;
  if (!Array.isArray(voices)) {
    return [];
  }

  return voices
    .map((item) => item as Record<string, unknown>)
    .map((voice) => ({
      id: typeof voice.id === 'string' ? voice.id : '',
      name: typeof voice.name === 'string' ? voice.name : 'Голос',
      category: typeof voice.category === 'string' ? voice.category : '',
      previewUrl: typeof voice.previewUrl === 'string' ? voice.previewUrl : null,
    }))
    .filter((voice) => Boolean(voice.id));
}

export async function startMediaGenerationAction(
  input: MediaStudioStartInput,
): Promise<MediaStudioActionResult> {
  const promptText = input.promptText.trim();

  if (!promptText) {
    return { status: 'failed', message: 'Опишите, что нужно создать.' };
  }

  if (!input.approved) {
    return {
      status: 'approval_required',
      message: 'Подтвердите запуск платной генерации.',
    };
  }

  try {
    let toolId: string;
    let args: Record<string, unknown>;

    if (input.kind === 'video') {
      toolId = 'media.video.generate';
      args = {
        prompt_text: promptText,
        ratio: input.ratio || '768:1280',
        duration: input.duration ?? 5,
      };
      if (input.imageUrl?.trim()) args.image_url = input.imageUrl.trim();
    } else if (input.kind === 'image') {
      toolId = 'media.image.generate';
      args = {
        prompt_text: promptText,
        ratio: input.ratio || '1080:1920',
        output_count: 1,
      };
    } else {
      if (!input.voiceId?.trim()) {
        return { status: 'failed', message: 'Выберите голос.' };
      }
      toolId = 'media.voice.generate';
      args = {
        text: promptText,
        voice_id: input.voiceId.trim(),
        model_id: 'eleven_multilingual_v2',
      };
    }

    const result = await executeMediaTool(toolId, args, { alreadyApproved: true });

    if (!result.success || !result.output) {
      if (result.error?.code === 'TOOL_APPROVAL_REQUIRED') {
        return {
          status: 'approval_required',
          message: result.error.message,
        };
      }
      return {
        status: 'failed',
        message: result.error?.message ?? 'Не удалось запустить генерацию.',
      };
    }

    const output = result.output as Record<string, unknown>;
    const id =
      typeof output.taskId === 'string'
        ? output.taskId
        : typeof output.generationId === 'string'
          ? output.generationId
          : '';

    if (!id) {
      return { status: 'failed', message: 'Провайдер не вернул ID задачи.' };
    }

    return { status: 'started', id, kind: input.kind };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Не удалось запустить генерацию.',
    };
  }
}

export async function getMediaGenerationStatusAction(
  kind: MediaStudioKind,
  id: string,
): Promise<MediaStudioStatusResult> {
  if (!id.trim()) {
    return {
      status: 'failed',
      providerStatus: 'missing_id',
      outputUrl: null,
      outputUrls: [],
      ephemeral: false,
    };
  }

  try {
    const toolId = kind === 'voice' ? 'media.voice.status' : 'media.runway.status';
    const args =
      kind === 'voice' ? { generation_id: id.trim() } : { task_id: id.trim() };
    const result = await executeMediaTool(toolId, args);

    if (!result.success || !result.output) {
      return {
        status: 'failed',
        providerStatus: result.error?.code ?? 'failed',
        outputUrl: null,
        outputUrls: [],
        ephemeral: false,
      };
    }

    const output = result.output as Record<string, unknown>;
    const providerStatus =
      typeof output.status === 'string' ? output.status : 'unknown';

    if (kind === 'voice') {
      const providerUrl = typeof output.outputUrl === 'string' ? output.outputUrl : null;

      if (!providerUrl) {
        return {
          status: normalizeVoiceStatus(providerStatus),
          providerStatus,
          outputUrl: null,
          outputUrls: [],
          ephemeral: false,
          persisted: false,
          storagePath: null,
        };
      }

      const persisted = await persistProviderAsset({
        sourceUrl: providerUrl,
        kind: 'audio',
        provider: 'elevenlabs',
        providerAssetId: id.trim(),
      });

      return {
        status: normalizeVoiceStatus(providerStatus),
        providerStatus,
        outputUrl: persisted.url,
        outputUrls: [persisted.url],
        ephemeral: !persisted.persisted,
        persisted: persisted.persisted,
        storagePath: persisted.storagePath,
      };
    }

    const outputUrls = Array.isArray(output.assetUrls)
      ? output.assetUrls.filter((item): item is string => typeof item === 'string')
      : [];
    const providerUrl = outputUrls[0] ?? null;

    if (!providerUrl) {
      return {
        status: normalizeRunwayStatus(providerStatus),
        providerStatus,
        outputUrl: null,
        outputUrls,
        ephemeral: Boolean(output.ephemeral),
        persisted: false,
        storagePath: null,
      };
    }

    const persisted = await persistProviderAsset({
      sourceUrl: providerUrl,
      kind: kind === 'image' ? 'image' : 'video',
      provider: 'runway',
      providerAssetId: id.trim(),
    });

    return {
      status: normalizeRunwayStatus(providerStatus),
      providerStatus,
      outputUrl: persisted.url,
      outputUrls: [persisted.url, ...outputUrls.slice(1)],
      ephemeral: !persisted.persisted,
      persisted: persisted.persisted,
      storagePath: persisted.storagePath,
    };
  } catch {
    return {
      status: 'failed',
      providerStatus: 'request_failed',
      outputUrl: null,
      outputUrls: [],
      ephemeral: false,
    };
  }
}


export async function refreshMediaAssetUrlAction(storagePath: string): Promise<string | null> {
  return refreshPersistedMediaUrl(storagePath);
}
