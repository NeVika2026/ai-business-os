export type PlatformModuleId =
  | 'create'
  | 'sell'
  | 'promote'
  | 'publish'
  | 'find'
  | 'analyze'
  | 'automate'
  | 'voice-agent'
  | 'communicate';

export type PlatformModule = {
  id: PlatformModuleId;
  label: string;
  description: string;
  icon: string;
  kind: 'work';
};

export type PlatformTask = {
  id: string;
  moduleId: PlatformModuleId;
  title: string;
  description: string;
  prompt: string;
  href?: string;
  badge?: string;
};

export type PlatformNavigationItem = {
  label: string;
  href: string;
  icon: string;
  moduleId?: PlatformModuleId;
};

export const BUSINESS_ZAVOD_MODULES: PlatformModule[] = [
  {
    id: 'create',
    label: 'Создать',
    description: 'Контент, видео, изображения, презентации и документы',
    icon: '✦',
    kind: 'work',
  },
  {
    id: 'sell',
    label: 'Продать',
    description: 'Офферы, скрипты, коммерческие предложения и воронки',
    icon: '₽',
    kind: 'work',
  },
  {
    id: 'promote',
    label: 'Продвинуть',
    description: 'Реклама, контент-планы и продвижение',
    icon: '↗',
    kind: 'work',
  },
  {
    id: 'publish',
    label: 'Опубликовать',
    description: 'Подготовка и публикация материалов по каналам',
    icon: '↑',
    kind: 'work',
  },
  {
    id: 'find',
    label: 'Найти',
    description: 'Клиенты, идеи, объекты, подрядчики и возможности',
    icon: '⌕',
    kind: 'work',
  },
  {
    id: 'analyze',
    label: 'Проанализировать',
    description: 'Конкуренты, предложения, данные и бизнес-ситуации',
    icon: '◫',
    kind: 'work',
  },
  {
    id: 'automate',
    label: 'Автоматизировать',
    description: 'Повторяющиеся процессы и рабочие цепочки',
    icon: '⚡',
    kind: 'work',
  },
  {
    id: 'voice-agent',
    label: 'Голосовой агент',
    description: 'Исходящие звонки, разговоры, расшифровки и записи',
    icon: '◉',
    kind: 'work',
  },
  {
    id: 'communicate',
    label: 'Связаться',
    description: 'WhatsApp, SMS и персональные сообщения по найденным лидам',
    icon: '✉',
    kind: 'work',
  },
];

export const BUSINESS_ZAVOD_NAVIGATION: PlatformNavigationItem[] = [
  { label: 'Главная', href: '/home', icon: 'today' },
  ...BUSINESS_ZAVOD_MODULES.map((module) => ({
    label: module.label,
    href: `/modules/${module.id}`,
    icon: module.icon,
    moduleId: module.id,
  })),
  { label: 'Проекты', href: '/projects', icon: 'projects' },
  { label: 'CRM', href: '/crm', icon: '◆' },
  { label: 'Входящие', href: '/crm/inbox', icon: '●' },
  { label: 'Аналитика CRM', href: '/crm/analytics', icon: '◫' },
  { label: 'Импорт CRM', href: '/crm/import', icon: '⇩' },
  { label: 'Дубли CRM', href: '/crm/duplicates', icon: '≋' },
  { label: 'Trend Lab', href: '/modules/create/viral', icon: '✺' },
  { label: 'Медиа', href: '/media', icon: '◫' },
  { label: 'Файлы', href: '/knowledge', icon: '📁' },
  { label: 'Интеграции', href: '/settings', icon: '⌘' },
];

export const BUSINESS_ZAVOD_TASKS: PlatformTask[] = [
  {
    id: 'create-viral-lab',
    moduleId: 'create',
    title: 'Trend Lab',
    description: 'Вирусные AI-механики из Reels и creator-инструментов: визуалы, UGC, product-video и новые форматы',
    prompt: 'Открой Trend Lab и выбери вирусную AI-механику.',
    href: '/modules/create/viral',
    badge: 'NEW',
  },
  {
    id: 'create-video',
    moduleId: 'create',
    title: 'Видео',
    description: 'Идея, сценарий, сцены, голос и финальная подача',
    prompt: 'Сделай сильное видео под мою задачу. Сначала предложи концепцию и сценарий.',
    href: '/modules/create/studio?mode=video',
    badge: 'Студия',
  },
  {
    id: 'create-image',
    moduleId: 'create',
    title: 'Картинка',
    description: 'Креатив, баннер, визуал или иллюстрация',
    prompt: 'Создай визуал под мою задачу.',
    href: '/modules/create/studio?mode=image',
  },
  {
    id: 'create-stories',
    moduleId: 'create',
    title: 'Сторис',
    description: 'Серия сторис с хуком и заявкой',
    prompt: 'Создай серию цепляющих сторис, которые ведут человека к заявке.',
    href: '/modules/create/studio?mode=stories',
  },
  {
    id: 'create-presentation',
    moduleId: 'create',
    title: 'Презентация',
    description: 'Структура и содержание презентации под цель',
    prompt: 'Собери сильную презентацию под мою задачу: структура, слайды и тексты.',
    href: '/modules/create/studio?mode=presentation',
  },
  {
    id: 'create-site',
    moduleId: 'create',
    title: 'Сайт',
    description: 'Готовый адаптивный лендинг с HTML и визуальным предпросмотром',
    prompt: 'Собери готовый лендинг под мою задачу.',
    href: '/modules/create/studio?mode=site',
    badge: 'HTML',
  },
  {
    id: 'create-document',
    moduleId: 'create',
    title: 'Документ',
    description: 'Коммерческое предложение, инструкция, план или материал',
    prompt: 'Подготовь документ под мою задачу.',
    href: '/modules/create/studio?mode=document',
  },
  {
    id: 'create-voice',
    moduleId: 'create',
    title: 'Озвучка',
    description: 'Текст, интонация и подготовка голоса',
    prompt: 'Подготовь озвучку под мою задачу.',
    href: '/modules/create/studio?mode=voice',
  },
  {
    id: 'communicate-whatsapp',
    moduleId: 'communicate',
    title: 'Написать в WhatsApp',
    description: 'Персональное сообщение через Evolution Go',
    prompt: 'Подготовь сообщение клиенту и отправь его в WhatsApp.',
    href: '/modules/communicate/studio',
    badge: 'WhatsApp',
  },
  {
    id: 'communicate-sms',
    moduleId: 'communicate',
    title: 'Отправить SMS',
    description: 'SMS через Android-телефон с httpSMS',
    prompt: 'Подготовь короткое SMS клиенту.',
    href: '/modules/communicate/studio',
    badge: 'SMS',
  },
  {
    id: 'communicate-leads',
    moduleId: 'communicate',
    title: 'Найти и обогатить лиды',
    description: 'Scout: открытые профили, контакты, email verification и lead score',
    prompt: 'Найди и обогати лиды под мой сегмент.',
    href: '/modules/communicate/studio',
    badge: 'Scout',
  },
  {
    id: 'voice-agent-call',
    moduleId: 'voice-agent',
    title: 'Позвонить клиенту',
    description: 'AI-агент звонит по номеру, ведёт разговор и возвращает расшифровку',
    prompt: 'Позвони клиенту и выполни задачу разговора.',
    href: '/modules/voice-agent/studio',
    badge: 'Звонок',
  },
  {
    id: 'voice-agent-followup',
    moduleId: 'voice-agent',
    title: 'Звонок по проекту',
    description: 'Контекст звонка можно сохранить в текущий проект',
    prompt: 'Сделай исходящий звонок в контексте моего проекта.',
    href: '/modules/voice-agent/studio',
  },
  {
    id: 'sell-offer',
    moduleId: 'sell',
    title: 'Оффер',
    description: 'Понятное предложение, которое хочется купить',
    prompt: 'Собери продающий оффер для моего продукта или услуги без канцелярщины.',
  },
  {
    id: 'sell-script',
    moduleId: 'sell',
    title: 'Скрипт продажи',
    description: 'Разговор, возражения и следующий шаг',
    prompt: 'Напиши живой скрипт продажи под мою ситуацию, включая ответы на возражения.',
  },
  {
    id: 'marketing-pack',
    moduleId: 'promote',
    title: 'Маркетинговый комплект',
    description: 'Оффер, аудитория, контент, ролики, реклама, продажи и конкуренты в одном результате',
    prompt: 'Создай полный маркетинговый комплект под мой продукт.',
    href: '/modules/promote/marketing-pack',
    badge: '7 блоков',
  },
  {
    id: 'promote-campaign',
    moduleId: 'promote',
    title: 'Рекламная кампания',
    description: 'Угол подачи, креативы и план запуска',
    prompt: 'Разработай рекламную кампанию: аудитория, оффер, креативы, каналы и план запуска.',
  },
  {
    id: 'promote-content-plan',
    moduleId: 'promote',
    title: 'Контент-план',
    description: 'Темы и форматы без пустых публикаций',
    prompt: 'Собери контент-план на месяц под мою цель с понятными темами и форматами.',
  },
  {
    id: 'publish-package',
    moduleId: 'publish',
    title: 'Пакет публикаций',
    description: 'Один исходник → отдельная версия для каждой площадки',
    prompt: 'Подготовь один материал к публикации на нескольких площадках с адаптацией формата.',
    href: '/modules/publish/studio',
    badge: '6 каналов',
  },
  {
    id: 'publish-social',
    moduleId: 'publish',
    title: 'Разнести по каналам',
    description: 'Telegram, ВКонтакте, Дзен, YouTube, TikTok и MAX',
    prompt: 'Адаптируй мой материал под Telegram, ВКонтакте, Дзен, YouTube, TikTok и MAX.',
    href: '/modules/publish/studio',
  },
  {
    id: 'find-clients',
    moduleId: 'find',
    title: 'Найти клиентов',
    description: 'Актуальные компании, сегменты и площадки из веб-поиска',
    prompt: 'Найди клиентов под мой продукт: сегменты, где искать и как выходить на контакт.',
    href: '/modules/find/studio?prompt=Найди%20клиентов%20под%20мой%20продукт%3A%20сегменты%2C%20где%20искать%20и%20как%20выходить%20на%20контакт.',
    badge: 'Web',
  },
  {
    id: 'find-opportunities',
    moduleId: 'find',
    title: 'Найти возможности',
    description: 'Партнёрства, площадки и направления роста по актуальным источникам',
    prompt: 'Найди возможности роста для моего проекта и расставь их по приоритету.',
    href: '/modules/find/studio?prompt=Найди%20возможности%20роста%20для%20моего%20проекта%20и%20расставь%20их%20по%20приоритету.',
    badge: 'Web',
  },
  {
    id: 'analyze-competitors',
    moduleId: 'analyze',
    title: 'Разобрать конкурентов',
    description: 'Факты из открытых источников, различия и окно для отстройки',
    prompt: 'Проанализируй конкурентов и покажи, как мне выгодно от них отстроиться.',
    href: '/modules/analyze/studio?prompt=Проанализируй%20моих%20конкурентов%20по%20актуальным%20открытым%20источникам%20и%20покажи%2C%20как%20можно%20отстроиться.',
    badge: 'Web',
  },
  {
    id: 'analyze-offer',
    moduleId: 'analyze',
    title: 'Разобрать предложение',
    description: 'Сравнить предложение с рынком и найти конкретные точки усиления',
    prompt: 'Разбери моё предложение глазами клиента и предложи конкретные улучшения.',
    href: '/modules/analyze/studio?prompt=Сравни%20моё%20предложение%20с%20рынком%20и%20покажи%2C%20что%20в%20нём%20непонятно%2C%20что%20не%20продаёт%20и%20как%20усилить.',
    badge: 'Web',
  },
  {
    id: 'automate-routine',
    moduleId: 'automate',
    title: 'Автоматизировать рутину',
    description: 'Найти повторяющиеся действия и собрать цепочку',
    prompt: 'Разбери мой процесс и предложи, что можно автоматизировать и в какой последовательности.',
  },
  {
    id: 'automate-leads',
    moduleId: 'automate',
    title: 'Обработка заявок',
    description: 'Маршрут лида от входа до следующего действия',
    prompt: 'Собери автоматизированный процесс обработки заявок от первого контакта до следующего шага.',
  },
];

export function getPlatformModule(moduleId: string): PlatformModule | undefined {
  return BUSINESS_ZAVOD_MODULES.find((module) => module.id === moduleId);
}

export function getPlatformTasks(moduleId?: string): PlatformTask[] {
  if (!moduleId) {
    return BUSINESS_ZAVOD_TASKS;
  }

  return BUSINESS_ZAVOD_TASKS.filter((task) => task.moduleId === moduleId);
}
