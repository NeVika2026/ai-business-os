export type CreateStudioModeId =
  | 'video'
  | 'image'
  | 'stories'
  | 'presentation'
  | 'document'
  | 'site'
  | 'voice';

export type CreateStudioMode = {
  id: CreateStudioModeId;
  label: string;
  description: string;
  icon: string;
  noun: string;
};

export type CreateStudioProductionStage = {
  id: string;
  label: string;
  detail: string;
};

export type CreateStudioBrief = {
  modeId: CreateStudioModeId;
  goal: string;
  audience?: string;
  format?: string;
  context?: string;
};

export const CREATE_STUDIO_MODES: CreateStudioMode[] = [
  {
    id: 'video',
    label: 'Видео',
    description: 'Концепция, сценарий, сцены, озвучка и финальная сборка',
    icon: '▶',
    noun: 'видео',
  },
  {
    id: 'image',
    label: 'Картинка',
    description: 'Рекламный креатив, баннер, визуал или иллюстрация',
    icon: '◇',
    noun: 'картинку',
  },
  {
    id: 'stories',
    label: 'Сторис',
    description: 'Серия сторис с хуком, логикой и призывом к действию',
    icon: '▤',
    noun: 'серию сторис',
  },
  {
    id: 'presentation',
    label: 'Презентация',
    description: 'Структура, слайды, тексты и визуальная логика',
    icon: '▥',
    noun: 'презентацию',
  },
  {
    id: 'document',
    label: 'Документ',
    description: 'Коммерческое предложение, инструкция, план или материал',
    icon: '▱',
    noun: 'документ',
  },
  {
    id: 'site',
    label: 'Сайт',
    description: 'Готовый адаптивный лендинг с визуальным предпросмотром и HTML-файлом',
    icon: '◈',
    noun: 'сайт',
  },
  {
    id: 'voice',
    label: 'Озвучка',
    description: 'Текст, интонация и подготовка голоса под задачу',
    icon: '◉',
    noun: 'озвучку',
  },
];

const CREATE_STUDIO_PRODUCTION_LINES: Record<CreateStudioModeId, CreateStudioProductionStage[]> = {
  video: [
    { id: 'idea', label: 'Идея', detail: 'Цель, хук и смысл ролика' },
    { id: 'script', label: 'Сценарий', detail: 'Текст, ритм и длительность' },
    { id: 'storyboard', label: 'Раскадровка', detail: 'Сцены и логика переходов' },
    { id: 'visual', label: 'Визуал', detail: 'Один стиль, герои и окружение' },
    { id: 'scenes', label: 'Сцены', detail: 'Подготовка и генерация кадров' },
    { id: 'voice', label: 'Голос', detail: 'Подача, темп и озвучка' },
    { id: 'captions', label: 'Субтитры', detail: 'Крупные читаемые титры' },
    { id: 'edit', label: 'Монтаж', detail: 'Сборка, музыка и ритм' },
    { id: 'qa', label: 'QA', detail: 'Связность, ошибки и синхронность' },
    { id: 'export', label: 'Экспорт', detail: 'Готовый файл под площадку' },
  ],
  image: [
    { id: 'idea', label: 'Идея', detail: 'Главный смысл и задача' },
    { id: 'composition', label: 'Композиция', detail: 'Иерархия и акцент' },
    { id: 'visual', label: 'Визуал', detail: 'Стиль, свет и материалы' },
    { id: 'generate', label: 'Генерация', detail: 'Основной вариант' },
    { id: 'retouch', label: 'Доработка', detail: 'Текст, детали и чистка' },
    { id: 'export', label: 'Экспорт', detail: 'Размеры под площадку' },
  ],
  stories: [
    { id: 'hook', label: 'Хук', detail: 'Первая карточка цепляет' },
    { id: 'story', label: 'Сюжет', detail: 'Логика и развитие мысли' },
    { id: 'cards', label: 'Карточки', detail: 'Текст каждой сторис' },
    { id: 'visual', label: 'Визуал', detail: 'Единый стиль серии' },
    { id: 'cta', label: 'CTA', detail: 'Переход к заявке' },
    { id: 'qa', label: 'QA', detail: 'Повторы, ритм и читаемость' },
    { id: 'export', label: 'Экспорт', detail: 'Готовая серия 9:16' },
  ],
  presentation: [
    { id: 'goal', label: 'Цель', detail: 'Что должна доказать презентация' },
    { id: 'structure', label: 'Структура', detail: 'Логика блоков и слайдов' },
    { id: 'copy', label: 'Тексты', detail: 'Короткие сильные формулировки' },
    { id: 'visual', label: 'Визуал', detail: 'Образ, сетка и стиль' },
    { id: 'slides', label: 'Слайды', detail: 'Сборка всей колоды' },
    { id: 'qa', label: 'QA', detail: 'Проверка смысла и верстки' },
    { id: 'export', label: 'Экспорт', detail: 'Финальный файл' },
  ],
  document: [
    { id: 'goal', label: 'Цель', detail: 'Задача документа' },
    { id: 'structure', label: 'Структура', detail: 'Разделы и порядок' },
    { id: 'draft', label: 'Черновик', detail: 'Содержание и аргументация' },
    { id: 'review', label: 'Проверка', detail: 'Факты, логика и язык' },
    { id: 'layout', label: 'Оформление', detail: 'Читаемая структура' },
    { id: 'export', label: 'Экспорт', detail: 'Готовый документ' },
  ],
  site: [
    { id: 'goal', label: 'Цель', detail: 'Оффер и главное действие' },
    { id: 'structure', label: 'Структура', detail: 'Блоки и логика страницы' },
    { id: 'copy', label: 'Тексты', detail: 'Готовый продающий контент' },
    { id: 'visual', label: 'Дизайн', detail: 'Типографика, сетка и атмосфера' },
    { id: 'build', label: 'Сборка', detail: 'Адаптивный HTML/CSS' },
    { id: 'qa', label: 'QA', detail: 'Читаемость и мобильная версия' },
    { id: 'export', label: 'Экспорт', detail: 'Готовый index.html' },
  ],
  voice: [
    { id: 'script', label: 'Текст', detail: 'Что именно произносить' },
    { id: 'direction', label: 'Подача', detail: 'Интонация, темп и эмоция' },
    { id: 'voice', label: 'Голос', detail: 'Подбор подходящего звучания' },
    { id: 'synthesis', label: 'Синтез', detail: 'Создание дорожки' },
    { id: 'mix', label: 'Сведение', detail: 'Чистка и громкость' },
    { id: 'export', label: 'Экспорт', detail: 'Готовый аудиофайл' },
  ],
};

export function getCreateStudioMode(modeId: CreateStudioModeId): CreateStudioMode {
  return CREATE_STUDIO_MODES.find((item) => item.id === modeId) ?? CREATE_STUDIO_MODES[0]!;
}

export function getCreateStudioProductionLine(
  modeId: CreateStudioModeId,
): CreateStudioProductionStage[] {
  return CREATE_STUDIO_PRODUCTION_LINES[modeId] ?? CREATE_STUDIO_PRODUCTION_LINES.video;
}

export function buildCreateStudioPrompt(input: CreateStudioBrief): string {
  const mode = getCreateStudioMode(input.modeId);
  const productionLine = getCreateStudioProductionLine(input.modeId);
  const lines = [
    'Создай ' + mode.noun + ' под мою задачу.',
    'Цель: ' + input.goal.trim(),
  ];

  if (input.audience?.trim()) lines.push('Аудитория: ' + input.audience.trim());
  if (input.format?.trim()) lines.push('Формат: ' + input.format.trim());
  if (input.context?.trim()) lines.push('Контекст: ' + input.context.trim());

  lines.push(
    '',
    'Производственная линия: ' + productionLine.map((stage) => stage.label).join(' → ') + '.',
    'Сначала предложи концепцию, структуру и производственный план.',
    'Если это видео или серия визуалов — сохраняй единый визуальный мир: одинаковые герои, пространство, реквизит, свет и стиль между сценами.',
    'Не запускай затратную генерацию или финальную сборку без моего подтверждения.',
    'После подтверждения двигайся по этапам последовательно и проверяй результат перед экспортом.',
  );

  return lines.join('\n');
}


const STUDIO_INTENT_SIGNALS: Array<{
  mode: CreateStudioModeId;
  signals: string[];
}> = [
  {
    mode: 'stories',
    signals: ['сторис', 'stories', 'истории для соцсет', 'серия историй'],
  },
  {
    mode: 'video',
    signals: [
      'видео',
      'ролик',
      'рилс',
      'reels',
      'клип',
      'мульт',
      'анимац',
      'video',
      'shorts',
      'тикток',
      'tiktok',
    ],
  },
  {
    mode: 'voice',
    signals: ['озвуч', 'голос', 'voiceover', 'voice over', 'аудиодорож', 'диктор'],
  },
  {
    mode: 'presentation',
    signals: ['презентац', 'слайды', 'слайд', 'pitch deck', 'питч-дек', 'deck'],
  },
  {
    mode: 'site',
    signals: ['сайт', 'лендинг', 'landing page', 'landing', 'одностраничник', 'веб-страниц'],
  },
  {
    mode: 'document',
    signals: [
      'коммерческое предложение',
      'компред',
      'документ',
      'инструкц',
      'регламент',
      'чек-лист',
      'чеклист',
    ],
  },
  {
    mode: 'image',
    signals: [
      'картин',
      'изображен',
      'баннер',
      'обложк',
      'иллюстрац',
      'постер',
      'фото',
      'image',
      'визуал',
    ],
  },
];

const TEXT_ONLY_SIGNALS = [
  'пост',
  'статья',
  'текст для',
  'контент-план',
  'контент план',
  'рассылка',
  'email-рассылка',
];

function normalizeStudioIntent(value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, 'е');
}

/**
 * Routes explicit production requests to Create Studio.
 * Text-only content stays in the content pipeline; media is never silently
 * collapsed into a post/content-plan deliverable.
 */
export function detectCreateStudioMode(input: string): CreateStudioModeId | null {
  const haystack = normalizeStudioIntent(input);

  if (!haystack) return null;

  const matched = STUDIO_INTENT_SIGNALS.find((rule) =>
    rule.signals.some((signal) => haystack.includes(signal)),
  );

  if (!matched) return null;

  const textOnly = TEXT_ONLY_SIGNALS.some((signal) => haystack.includes(signal));
  const hasStrongMediaIntent = ['video', 'stories', 'voice', 'image', 'site'].includes(matched.mode);

  if (textOnly && !hasStrongMediaIntent) {
    return null;
  }

  return matched.mode;
}

export function buildCreateStudioHref(
  modeId: CreateStudioModeId,
  goal: string,
  options?: {
    audience?: string;
    format?: string;
    context?: string;
    projectId?: string | null;
  },
): string {
  const params = new URLSearchParams();
  params.set('mode', modeId);
  params.set('goal', goal.trim());

  if (options?.audience?.trim()) params.set('audience', options.audience.trim());
  if (options?.format?.trim()) params.set('format', options.format.trim());
  if (options?.context?.trim()) params.set('context', options.context.trim());
  if (options?.projectId?.trim()) params.set('project', options.projectId.trim());

  return '/modules/create/studio?' + params.toString();
}
