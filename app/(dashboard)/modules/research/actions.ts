'use server';

import { randomUUID } from 'node:crypto';

import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { createClient } from '@/services/supabase/server';
import { createProductionToolRegistry } from '@/services/runtime/tools/tool-registry';
import { createToolExecutor } from '@/services/runtime/tools/executor/tool-executor-factory';
import type { GatewayRequest } from '@/types/runtime/dto';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { ensureFactoryProject, saveFactoryArtifact } from '@/lib/factory-chain/persistence';
import { loadProjectMemory } from '@/lib/projects/project-memory';

export type ResearchMode = 'find' | 'analyze';

export type ResearchSource = {
  title: string;
  url: string;
  description: string;
  source: string | null;
  age: string | null;
};

export type ResearchResult =
  | {
      status: 'completed';
      projectId: string;
      summary: string;
      sources: ResearchSource[];
    }
  | {
      status: 'failed';
      message: string;
      sources?: ResearchSource[];
    };

async function resolveResearchIdentity() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Требуется авторизация.');

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error('Организация не найдена.');

  return {
    organizationId,
    userId: user.id,
  };
}

async function runWebSearch(query: string, limit = 8) {
  const identity = await resolveResearchIdentity();
  const registry = createProductionToolRegistry();
  const executor = createToolExecutor(registry);
  const runId = randomUUID();
  const tool = registry.get('web.search');

  if (!tool) throw new Error('Инструмент веб-поиска недоступен.');

  const result = await executor.execute({
    call: {
      id: randomUUID(),
      name: 'web.search',
      arguments: { query, limit },
      audit: {
        runId,
        employeeId: identity.userId,
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
      id: identity.userId,
      roleTitle: 'Researcher',
      permissions: { web_search: true },
      enabledTools: ['web.search'],
    },
    category: tool.category,
    toolPermissions: tool.permissions,
    approvalPolicy: tool.approvalPolicy,
    alreadyApproved: true,
    requestMetadata: {
      source: 'research-studio',
      explicitUserAction: true,
    },
  });

  if (!result.success || !result.output) {
    throw new Error(result.error?.message ?? 'Не удалось выполнить веб-поиск.');
  }

  return {
    identity,
    runId,
    output: result.output as {
      results?: Array<{
        title?: string;
        url?: string;
        description?: string;
        source?: string | null;
        age?: string | null;
      }>;
      available?: boolean;
      message?: string;
    },
  };
}

export type PriorResearchContext = {
  query: string;
  summary: string;
  sources: ResearchSource[];
};

export async function runResearchAction(input: {
  mode: ResearchMode;
  query: string;
  projectId?: string | null;
  priorContext?: PriorResearchContext | null;
}): Promise<ResearchResult> {
  const query = input.query.trim();

  if (!query) {
    return { status: 'failed', message: 'Опишите, что нужно найти или проанализировать.' };
  }

  try {
    const project = await ensureFactoryProject({
      projectId: input.projectId,
      seed: query,
      stage: input.mode,
    });

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

    let identity: Awaited<ReturnType<typeof resolveResearchIdentity>>;
    let runId: string;
    let sources: ResearchSource[];

    const canReusePriorResearch =
      input.mode === 'analyze' &&
      Boolean(input.priorContext?.sources?.length);

    if (canReusePriorResearch && input.priorContext) {
      identity = await resolveResearchIdentity();
      runId = randomUUID();
      sources = input.priorContext.sources
        .map((item) => ({
          title: item.title?.trim() || 'Источник',
          url: item.url?.trim() || '',
          description: item.description?.trim() || '',
          source: item.source ?? null,
          age: item.age ?? null,
        }))
        .filter((item) => Boolean(item.url));
    } else {
      const search = await runWebSearch(query, 8);

      if (search.output.available === false) {
        return {
          status: 'failed',
          message: search.output.message || 'Веб-поиск не подключён.',
        };
      }

      identity = search.identity;
      runId = search.runId;
      sources = (search.output.results ?? [])
        .map((item) => ({
          title: item.title?.trim() || 'Источник',
          url: item.url?.trim() || '',
          description: item.description?.trim() || '',
          source: item.source ?? null,
          age: item.age ?? null,
        }))
        .filter((item) => Boolean(item.url));
    }

    if (!sources.length) {
      return {
        status: 'failed',
        message: 'Поиск не вернул подходящих источников. Попробуйте изменить запрос.',
      };
    }

    const numberedSources = sources
      .map(
        (item, index) =>
          `[${index + 1}] ${item.title}\n${item.url}\n${item.description}`,
      )
      .join('\n\n');

    const modeInstruction =
      input.mode === 'find'
        ? 'Найди конкретные возможности, сегменты, компании, площадки или направления, которые реально следуют из источников. Дай приоритет практическим находкам и следующему действию.'
        : 'Проанализируй найденные данные: выдели факты, различия, риски, сильные и слабые стороны и практический вывод. Не придумывай отсутствующие данные.';

    const priorSummary =
      input.mode === 'analyze' && input.priorContext?.summary?.trim()
        ? [
            '',
            'ПРЕДЫДУЩИЙ РЕЗУЛЬТАТ ЦЕХА ПОИСКА:',
            input.priorContext.summary.trim(),
            '',
            'Используй его только как рабочий контекст. Факты всё равно должны опираться на источники ниже.',
          ].join('\n')
        : '';

    const prompt = [
      'Ты — исследовательский цех Бизнес-Завода.',
      '',
      'ЗАПРОС:',
      query,
      memoryContext ? '\nПАМЯТЬ ПРОЕКТА:\n' + memoryContext : '',
      priorSummary,
      '',
      modeInstruction,
      '',
      'ИСТОЧНИКИ:',
      numberedSources,
      '',
      'Правила:',
      '- используй только факты, которые поддерживаются источниками;',
      '- ссылки на источники обозначай [1], [2] и т.д.;',
      '- если источник не подтверждает конкретный вывод, не утверждай его как факт;',
      '- отделяй найденные факты от своих выводов;',
      '- пиши по-русски, конкретно и без канцелярщины;',
      '- в конце дай блок «Что делать дальше» с 3–5 конкретными действиями.',
    ].join('\n');

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
        temperature: 0.2,
        maxTokens: 2600,
      },
      timeoutMs: 45_000,
      retryPolicy: {
        maxAttempts: 2,
        backoffMs: [700, 1400],
      },
      routing: {
        intent: input.mode === 'find' ? 'web_find' : 'web_analyze',
        taskCategory: 'analysis',
        estimatedContextLength: prompt.length,
        reasoningComplexity: 'high',
        latencyTarget: 'quality',
        costTarget: 'balanced',
        toolUsage: false,
      },
    };

    const response = await aiGateway.complete(request);
    const summary = response.content?.trim();

    if (!summary) {
      return {
        status: 'failed',
        message: 'Источники найдены, но OSA не смогла собрать вывод.',
        sources,
      };
    }

    await saveFactoryArtifact({
      projectId: project.projectId,
      stage: input.mode,
      title: input.mode === 'find' ? 'Результат поиска' : 'Результат анализа',
      content: summary,
      sources: sources.map((source) => ({
        title: source.title,
        url: source.url,
        description: source.description,
      })),
      metadata: {
        query,
        mode: input.mode,
      },
      identity: project.identity,
    });

    return {
      status: 'completed',
      projectId: project.projectId,
      summary,
      sources,
    };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Исследование завершилось с ошибкой.',
    };
  }
}
