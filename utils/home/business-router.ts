import type { CreateStudioModeId } from '@/utils/platform/create-studio';

export type BusinessRouterKind = 'direct' | 'factory_bundle' | 'real_work';

export type BusinessRouterOutput =
  | 'video'
  | 'stories'
  | 'image'
  | 'banner'
  | 'post'
  | 'telegram'
  | 'voice'
  | 'site'
  | 'presentation'
  | 'document';

export type BusinessRouterPlan = {
  kind: BusinessRouterKind;
  intent: string;
  outputs: BusinessRouterOutput[];
  tools: string[];
  parallel: string[];
  dependencies: Record<string, string[]>;
  directHref: string | null;
  studioMode: CreateStudioModeId | null;
};

const OUTPUT_SIGNALS: Array<{ output: BusinessRouterOutput; signals: string[] }> = [
  { output: 'stories', signals: ['сторис', 'stories', 'истории для соцсет'] },
  { output: 'video', signals: ['видео', 'ролик', 'рилс', 'reels', 'shorts', 'tiktok', 'тикток'] },
  { output: 'voice', signals: ['озвуч', 'голос', 'voiceover', 'диктор', 'аудиодорож'] },
  { output: 'banner', signals: ['баннер', 'рекламный креатив', 'креатив'] },
  { output: 'image', signals: ['картин', 'изображен', 'визуал', 'фото', 'постер', 'обложк'] },
  { output: 'presentation', signals: ['презентац', 'слайд', 'pitch deck', 'питч-дек'] },
  { output: 'site', signals: ['сайт', 'лендинг', 'landing page', 'одностраничник'] },
  { output: 'document', signals: ['документ', 'коммерческое предложение', 'компред', 'инструкц', 'регламент'] },
  { output: 'telegram', signals: ['telegram', 'телеграм', 'тг'] },
  { output: 'post', signals: ['пост', 'статья', 'текст для', 'публикац'] },
];

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, 'е');
}

function includesAny(haystack: string, signals: string[]): boolean {
  return signals.some((signal) => haystack.includes(signal));
}

function detectOutputs(input: string): BusinessRouterOutput[] {
  const haystack = normalize(input);
  const outputs: BusinessRouterOutput[] = [];

  for (const rule of OUTPUT_SIGNALS) {
    if (includesAny(haystack, rule.signals)) {
      outputs.push(rule.output);
    }
  }

  return [...new Set(outputs)];
}

function createStudioModeForOutput(output: BusinessRouterOutput): CreateStudioModeId | null {
  switch (output) {
    case 'video':
      return 'video';
    case 'stories':
      return 'stories';
    case 'image':
    case 'banner':
      return 'image';
    case 'voice':
      return 'voice';
    case 'site':
      return 'site';
    case 'presentation':
      return 'presentation';
    case 'document':
      return 'document';
    default:
      return null;
  }
}

function buildStudioHref(mode: CreateStudioModeId, prompt: string): string {
  const params = new URLSearchParams();
  params.set('mode', mode);
  params.set('goal', prompt.trim());
  return '/modules/create/studio?' + params.toString();
}

function detectDirectModule(haystack: string): string | null {
  if (
    /(^|\s)(найди|поиск|поищи)(\s|$)/.test(haystack) ||
    haystack.includes('найди клиентов') ||
    haystack.includes('найди конкурентов') ||
    haystack.includes('найди партнер')
  ) {
    return '/modules/find/studio';
  }

  if (
    haystack.includes('проанализируй') ||
    haystack.includes('анализ конкур') ||
    haystack.includes('сравни конкур') ||
    haystack.includes('разбери рынок') ||
    haystack.includes('анализ рынка')
  ) {
    return '/modules/analyze/studio';
  }

  if (
    haystack.includes('клиенты ответили') ||
    haystack.includes('кто ответил') ||
    haystack.includes('входящие лиды') ||
    haystack.includes('кто ждет ответа') ||
    haystack.includes('кто ждет ответа') ||
    haystack.includes('просроченные лиды')
  ) {
    return '/crm/inbox';
  }

  if (
    haystack.includes('аналитика crm') ||
    haystack.includes('аналитика продаж') ||
    haystack.includes('воронка продаж') ||
    haystack.includes('конверсия лидов') ||
    haystack.includes('источники лидов')
  ) {
    return '/crm/analytics';
  }

  if (
    haystack.includes('импорт crm') ||
    haystack.includes('импорт базы') ||
    haystack.includes('загрузи базу') ||
    haystack.includes('импорт лидов')
  ) {
    return '/crm/import';
  }

  if (
    haystack.includes('дубли crm') ||
    haystack.includes('дубли лидов') ||
    haystack.includes('дубли клиентов') ||
    haystack.includes('объединить дубли')
  ) {
    return '/crm/duplicates';
  }

  if (
    haystack === 'crm' ||
    haystack.includes('открой crm') ||
    haystack.includes('покажи crm') ||
    haystack.includes('мои лиды') ||
    haystack.includes('мои клиенты') ||
    haystack.includes('база клиентов')
  ) {
    return '/crm';
  }

  if (
    haystack.includes('напиши в whatsapp') ||
    haystack.includes('напиши в ватсап') ||
    haystack.includes('отправь whatsapp') ||
    haystack.includes('отправь ватсап') ||
    haystack.includes('отправь sms') ||
    haystack.includes('отправь смс') ||
    haystack.includes('свяжись с клиентом')
  ) {
    return '/modules/communicate/studio';
  }

  if (
    haystack.includes('позвони') ||
    haystack.includes('обзвони') ||
    haystack.includes('голосовой агент') ||
    haystack.includes('голосовой ассистент') ||
    haystack.includes('исходящий звонок')
  ) {
    return '/modules/voice-agent/studio';
  }

  if (
    haystack.includes('опубликуй') ||
    haystack.includes('к публикации') ||
    haystack.includes('под публикац') ||
    haystack.includes('адаптируй под telegram') ||
    haystack.includes('адаптируй под вк') ||
    haystack.includes('адаптируй под дзен')
  ) {
    return '/modules/publish/studio';
  }

  return null;
}

function toolsForOutputs(outputs: BusinessRouterOutput[]): string[] {
  const tools = new Set<string>(['strategy.copy']);

  for (const output of outputs) {
    if (output === 'video') tools.add('media.video.generate');
    if (output === 'stories' || output === 'image' || output === 'banner') {
      tools.add('media.image.generate');
    }
    if (output === 'voice') tools.add('media.voice.generate');
    if (output === 'post' || output === 'telegram' || output === 'document') {
      tools.add('copy.generate');
    }
    if (output === 'site') tools.add('site.build');
    if (output === 'presentation') tools.add('presentation.build');
  }

  if (outputs.length > 1) tools.add('package.assemble');
  return [...tools];
}

function dependenciesForOutputs(outputs: BusinessRouterOutput[]): Record<string, string[]> {
  const dependencies: Record<string, string[]> = {};

  if (outputs.includes('video')) {
    dependencies.video = ['strategy', 'script'];
    if (outputs.includes('image') || outputs.includes('banner') || outputs.includes('stories')) {
      dependencies.video.push('visuals');
    }
    if (outputs.includes('voice')) dependencies.video.push('voice');
  }

  if (outputs.includes('stories')) dependencies.stories = ['strategy', 'copy'];
  if (outputs.includes('banner')) dependencies.banner = ['strategy', 'copy'];
  if (outputs.includes('post')) dependencies.post = ['strategy'];
  if (outputs.includes('telegram')) dependencies.telegram = ['strategy'];

  return dependencies;
}

export function resolveBusinessRouterPlan(input: string): BusinessRouterPlan {
  const trimmed = input.trim();
  const haystack = normalize(trimmed);
  const outputs = detectOutputs(trimmed);
  const directModule = detectDirectModule(haystack);

  if (directModule) {
    const href =
      directModule === '/modules/find/studio' || directModule === '/modules/analyze/studio'
        ? directModule + '?prompt=' + encodeURIComponent(trimmed)
        : directModule;

    return {
      kind: 'direct',
      intent: 'module_action',
      outputs,
      tools: [],
      parallel: [],
      dependencies: {},
      directHref: href,
      studioMode: null,
    };
  }

  const productionOutputs = outputs.filter((output) => createStudioModeForOutput(output) !== null);

  if (outputs.length >= 2) {
    const parallel = [
      outputs.some((output) => ['image', 'banner', 'stories'].includes(output)) ? 'visuals' : '',
      outputs.some((output) => ['post', 'telegram', 'document'].includes(output)) ? 'copy' : '',
    ].filter(Boolean);

    return {
      kind: 'factory_bundle',
      intent: 'campaign_bundle',
      outputs,
      tools: toolsForOutputs(outputs),
      parallel,
      dependencies: dependenciesForOutputs(outputs),
      directHref: '/modules/factory?prompt=' + encodeURIComponent(trimmed),
      studioMode: null,
    };
  }

  if (productionOutputs.length === 1) {
    const mode = createStudioModeForOutput(productionOutputs[0]!);

    if (mode) {
      return {
        kind: 'direct',
        intent: 'single_production',
        outputs,
        tools: toolsForOutputs(outputs),
        parallel: [],
        dependencies: dependenciesForOutputs(outputs),
        directHref: buildStudioHref(mode, trimmed),
        studioMode: mode,
      };
    }
  }

  return {
    kind: 'real_work',
    intent: 'general_business_task',
    outputs,
    tools: toolsForOutputs(outputs),
    parallel: [],
    dependencies: dependenciesForOutputs(outputs),
    directHref: null,
    studioMode: null,
  };
}

export function buildFactoryBundlePrompt(plan: BusinessRouterPlan, originalPrompt: string): string {
  const dependencyLines = Object.entries(plan.dependencies).map(
    ([target, needs]) => target + ': ' + needs.join(', '),
  );

  return [
    'Режим: пакетное производство Бизнес-Завода.',
    'Исходная задача:',
    originalPrompt.trim(),
    '',
    'Нужные результаты: ' + plan.outputs.join(', ') + '.',
    'Подключить цеха: ' + plan.tools.join(', ') + '.',
    plan.parallel.length ? 'Параллельно: ' + plan.parallel.join(', ') + '.' : '',
    dependencyLines.length ? 'Зависимости: ' + dependencyLines.join('; ') + '.' : '',
    '',
    'Важно: не своди запрос к одному формату. Собери единый проект и все перечисленные результаты.',
    'Если один этап упал, повторяй только его, а не весь проект.',
  ]
    .filter(Boolean)
    .join('\n');
}
