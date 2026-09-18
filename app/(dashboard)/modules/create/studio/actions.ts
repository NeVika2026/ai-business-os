'use server';

import { randomUUID } from 'node:crypto';

import { createClient } from '@/services/supabase/server';
import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import type { GatewayRequest } from '@/types/runtime/dto';
import type { CreateStudioModeId } from '@/utils/platform/create-studio';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { ensureFactoryProject, saveFactoryArtifact } from '@/lib/factory-chain/persistence';
import { loadProjectMemory } from '@/lib/projects/project-memory';
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
  model?: string;
  projectId?: string | null;
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
    let effectivePromptText = promptText;

    if (input.projectId?.trim()) {
      const identity = await resolveMediaExecutionIdentity();
      const supabase = await createClient();
      const memory = await loadProjectMemory(
        supabase,
        identity.organizationId,
        input.projectId.trim(),
      );
      const memoryContext = [
        memory.goals ? 'Цели проекта: ' + memory.goals : '',
        memory.audience ? 'Аудитория проекта: ' + memory.audience : '',
        memory.style ? 'Стиль проекта: ' + memory.style : '',
        memory.decisions ? 'Принятые решения: ' + memory.decisions : '',
        memory.constraints ? 'Не делать / ограничения: ' + memory.constraints : '',
      ].filter(Boolean).join('\n');

      if (memoryContext) {
        effectivePromptText = [
          promptText,
          '',
          'ПАМЯТЬ ПРОЕКТА:',
          memoryContext,
        ].join('\n');
      }
    }

    let toolId: string;
    let args: Record<string, unknown>;

    if (input.kind === 'video') {
      toolId = 'media.video.generate';
      args = {
        prompt_text: effectivePromptText,
        model: input.model?.trim() || 'gen4.5',
        ratio: input.ratio || '768:1280',
        duration: input.duration ?? 5,
      };
      if (input.imageUrl?.trim()) args.image_url = input.imageUrl.trim();
    } else if (input.kind === 'image') {
      toolId = 'media.image.generate';
      args = {
        prompt_text: effectivePromptText,
        model: input.model?.trim() || 'gen4_image',
        ratio: input.ratio || '1080:1920',
        output_count: 1,
      };
      if (input.imageUrl?.trim()) {
        args.reference_images = [input.imageUrl.trim()];
      }
    } else {
      if (!input.voiceId?.trim()) {
        return { status: 'failed', message: 'Выберите голос.' };
      }
      toolId = 'media.voice.generate';
      args = {
        text: effectivePromptText,
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
  projectId?: string | null,
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
        projectId,
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
      projectId,
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


export async function getMediaUploadContextAction(projectId?: string | null): Promise<{
  organizationId: string;
  userId: string;
  projectId: string | null;
} | null> {
  try {
    const identity = await resolveMediaExecutionIdentity();
    let authorizedProjectId: string | null = null;

    if (projectId?.trim()) {
      const supabase = await createClient();
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId.trim())
        .eq('organization_id', identity.organizationId)
        .maybeSingle();

      authorizedProjectId = project?.id ? String(project.id) : null;
    }

    return {
      organizationId: identity.organizationId,
      userId: identity.userId,
      projectId: authorizedProjectId,
    };
  } catch {
    return null;
  }
}


export type CreateStudioArtifactResult =
  | { status: 'completed'; projectId: string; content: string }
  | { status: 'failed'; message: string };

function buildStudioArtifactPrompt(input: {
  modeId: CreateStudioModeId;
  goal: string;
  audience?: string;
  format?: string;
  context?: string;
}) {
  const modeInstruction =
    input.modeId === 'stories'
      ? 'Создай готовую серию сторис: для каждой карточки дай номер, хук/заголовок, короткий текст, визуальную идею и CTA. Нужна связная последовательность, ведущая к заявке.'
      : input.modeId === 'presentation'
        ? 'Создай готовое содержание презентации: титульный слайд и далее каждый слайд с названием, ключевым текстом и визуальной идеей. Не пиши план презентации — пиши уже содержимое слайдов.'
        : input.modeId === 'document'
          ? 'Создай готовый документ по задаче: понятный заголовок, разделы и полный рабочий текст. Это должен быть материал, который можно сразу редактировать и использовать.'
          : 'Создай готовый текстовый результат по задаче.';

  return [
    'Ты — производственный AI-редактор Бизнес-Завода.',
    'Не объясняй, что нужно сделать. Сразу производи готовый результат.',
    '',
    'ЗАДАЧА:',
    input.goal.trim(),
    input.audience?.trim() ? 'Аудитория: ' + input.audience.trim() : '',
    input.format?.trim() ? 'Формат: ' + input.format.trim() : '',
    input.context?.trim() ? 'Важно учесть: ' + input.context.trim() : '',
    '',
    modeInstruction,
    '',
    'Правила:',
    '- русский язык;',
    '- без канцелярщины и пустых общих фраз;',
    '- не выдумывай факты, цены, цифры, отзывы, гарантии или достижения, которых нет в задаче;',
    '- если данных не хватает, используй нейтральные формулировки без выдуманных фактов;',
    '- не используй markdown-таблицы;',
    '- верни только готовый материал.',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function generateCreateStudioArtifactAction(input: {
  modeId: CreateStudioModeId;
  goal: string;
  audience?: string;
  format?: string;
  context?: string;
  projectId?: string | null;
}): Promise<CreateStudioArtifactResult> {
  if (!input.goal.trim()) {
    return { status: 'failed', message: 'Опишите, что нужно создать.' };
  }

  try {
    const project = await ensureFactoryProject({
      projectId: input.projectId,
      seed: input.goal,
      stage: 'create',
    });
    const identity = await resolveMediaExecutionIdentity();
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
    const effectiveContext = [input.context?.trim(), memoryContext]
      .filter(Boolean)
      .join('\n\n');
    const runId = randomUUID();

    const request: GatewayRequest = {
      scope: {
        organizationId: identity.organizationId,
        userId: identity.userId,
      },
      trace: {
        runId,
        traceId: runId,
        correlationId: runId,
      },
      providerCode: 'auto',
      modelCode: 'auto',
      messages: [
        {
          role: 'user',
          content: buildStudioArtifactPrompt({
            ...input,
            context: effectiveContext,
          }),
        },
      ],
      tools: [],
      parameters: {
        temperature: 0.35,
        maxTokens: input.modeId === 'presentation' ? 2600 : 2200,
      },
      timeoutMs: 45_000,
      retryPolicy: {
        maxAttempts: 2,
        backoffMs: [700, 1400],
      },
      routing: {
        intent: 'create_studio_artifact',
        taskCategory: 'creative',
        estimatedContextLength:
          input.goal.length +
          (input.audience?.length ?? 0) +
          (input.format?.length ?? 0) +
          effectiveContext.length,
        reasoningComplexity: 'high',
        latencyTarget: 'quality',
        costTarget: 'balanced',
        toolUsage: false,
      },
    };

    const response = await aiGateway.complete(request);
    const content = response.content?.trim();

    if (!content) {
      return { status: 'failed', message: 'OSA не вернула готовый материал. Попробуйте ещё раз.' };
    }

    await saveFactoryArtifact({
      projectId: project.projectId,
      stage: 'create',
      title:
        input.modeId === 'presentation'
          ? 'Презентация'
          : input.modeId === 'stories'
            ? 'Серия сторис'
            : 'Документ',
      content,
      metadata: {
        modeId: input.modeId,
        goal: input.goal,
        audience: input.audience ?? '',
        format: input.format ?? '',
      },
      identity: project.identity,
    });

    return { status: 'completed', projectId: project.projectId, content };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Не удалось собрать материал.',
    };
  }
}


export type WebsiteArtifactResult =
  | { status: 'completed'; projectId: string; html: string; title: string }
  | { status: 'failed'; message: string };

function stripWebsiteFence(value: string): string {
  return value
    .trim()
    .replace(/^\`\`\`(?:html)?\s*/i, '')
    .replace(/\s*\`\`\`$/, '')
    .trim();
}

function sanitizeGeneratedWebsite(value: string): string {
  let html = stripWebsiteFence(value);

  html = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<(?:object|embed)\b[^>]*>[\s\S]*?<\/(?:object|embed)>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');

  if (!/<html\b/i.test(html)) {
    html =
      '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' +
      html +
      '</body></html>';
  }

  return html;
}

function extractWebsiteTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() || 'Готовый лендинг';
}

export async function generateWebsiteArtifactAction(input: {
  goal: string;
  audience?: string;
  format?: string;
  context?: string;
  projectId?: string | null;
}): Promise<WebsiteArtifactResult> {
  const goal = input.goal.trim();

  if (!goal) {
    return { status: 'failed', message: 'Опишите, какой сайт нужно собрать.' };
  }

  try {
    const project = await ensureFactoryProject({
      projectId: input.projectId,
      seed: goal,
      stage: 'create',
    });
    const identity = await resolveMediaExecutionIdentity();
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
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = [
      'Ты — senior web designer и frontend-разработчик Бизнес-Завода.',
      'Собери ГОТОВЫЙ одностраничный адаптивный сайт, а не план и не рекомендации.',
      '',
      'ЗАДАЧА:',
      goal,
      input.audience?.trim() ? 'Аудитория: ' + input.audience.trim() : '',
      input.format?.trim() ? 'Формат / пожелания: ' + input.format.trim() : '',
      input.context?.trim() ? 'Контекст: ' + input.context.trim() : '',
      memoryContext ? 'ПАМЯТЬ ПРОЕКТА:\n' + memoryContext : '',
      '',
      'Технические требования:',
      '- верни только один полный HTML-документ от <!doctype html> до </html>;',
      '- весь CSS только внутри <style>, без внешних библиотек и без CDN;',
      '- никакого JavaScript;',
      '- адаптивная верстка для телефона и десктопа;',
      '- современная дорогая визуальная подача, сильная типографика и ясная иерархия;',
      '- реальные секции по смыслу задачи: первый экран, проблема, решение, услуги/выгоды, доверие, тарифы или условия если уместно, FAQ, финальный CTA;',
      '- если пользователь просил форму, сделай визуально готовую форму с полями Имя, Телефон, Email, Комментарий и кнопкой, но без фиктивного backend;',
      '- не выдумывай количество клиентов, годы работы, отзывы, гарантии, цены, проценты, сроки ответа и другие факты, которых нет в задаче;',
      '- если цены не даны, используй нейтральную формулировку вроде «Стоимость после оценки задачи»;',
      '- никакого lorem ipsum, TODO, placeholder-блоков и квадратных скобок;',
      '- русский язык, если пользователь не попросил другой.',
    ]
      .filter(Boolean)
      .join('\n');

    const runId = randomUUID();
    const request: GatewayRequest = {
      scope: {
        organizationId: identity.organizationId,
        userId: identity.userId,
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
        temperature: 0.3,
        maxTokens: 6500,
      },
      timeoutMs: 60_000,
      retryPolicy: {
        maxAttempts: 2,
        backoffMs: [800, 1600],
      },
      routing: {
        intent: 'website_artifact',
        taskCategory: 'creative',
        estimatedContextLength: prompt.length,
        reasoningComplexity: 'high',
        latencyTarget: 'quality',
        costTarget: 'balanced',
        toolUsage: false,
      },
    };

    const response = await aiGateway.complete(request);
    const raw = response.content?.trim();

    if (!raw) {
      return {
        status: 'failed',
        message: 'OSA не вернула HTML сайта. Попробуйте ещё раз.',
      };
    }

    const html = sanitizeGeneratedWebsite(raw);
    const title = extractWebsiteTitle(html);

    if (html.length < 500 || !/<body\b/i.test(html)) {
      return {
        status: 'failed',
        message: 'Получился неполный HTML. Повторите сборку сайта.',
      };
    }

    await saveFactoryArtifact({
      projectId: project.projectId,
      stage: 'create',
      title: 'Сайт · ' + title,
      content: html,
      metadata: {
        modeId: 'site',
        goal,
        audience: input.audience ?? '',
        format: input.format ?? '',
        artifactType: 'website_html',
      },
      identity: project.identity,
    });

    return {
      status: 'completed',
      projectId: project.projectId,
      html,
      title,
    };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Не удалось собрать сайт.',
    };
  }
}
