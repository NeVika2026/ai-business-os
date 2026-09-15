export type PlatformModuleId =
  | 'create'
  | 'sell'
  | 'promote'
  | 'publish'
  | 'find'
  | 'analyze'
  | 'automate';

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
  { label: 'Медиа', href: '/media', icon: '◫' },
  { label: 'Файлы', href: '/knowledge', icon: '📁' },
  { label: 'Интеграции', href: '/settings', icon: '⌘' },
];

export const BUSINESS_ZAVOD_TASKS: PlatformTask[] = [
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
    description: 'Подготовить материал под несколько площадок',
    prompt: 'Подготовь один материал к публикации на нескольких площадках с адаптацией формата.',
  },
  {
    id: 'find-clients',
    moduleId: 'find',
    title: 'Найти клиентов',
    description: 'Сегменты, источники и конкретный план поиска',
    prompt: 'Помоги найти клиентов под мой продукт: сегменты, где искать и как выходить на контакт.',
  },
  {
    id: 'find-opportunities',
    moduleId: 'find',
    title: 'Найти возможности',
    description: 'Идеи роста, партнёрства и новые направления',
    prompt: 'Найди возможности роста для моего проекта и расставь их по приоритету.',
  },
  {
    id: 'analyze-competitors',
    moduleId: 'analyze',
    title: 'Разобрать конкурентов',
    description: 'Сильные стороны, слабые места и окно для отстройки',
    prompt: 'Проанализируй конкурентов и покажи, как мне выгодно от них отстроиться.',
  },
  {
    id: 'analyze-offer',
    moduleId: 'analyze',
    title: 'Разобрать предложение',
    description: 'Что непонятно, что не продаёт и как усилить',
    prompt: 'Разбери моё предложение глазами клиента и предложи конкретные улучшения.',
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
