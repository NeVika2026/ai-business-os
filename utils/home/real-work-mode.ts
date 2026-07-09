import type { DeliverableType } from '@/types/deliverables';
import type { HomeQuickActionId } from '@/utils/home/home-action';
import type { ProjectType } from '@/utils/projects/project-types';
import { matchesAnyOsaPattern, normalizeOsaText } from '@/utils/osa/text-matching';

export const REAL_WORK_TASK_TYPES = [
  'presentation',
  'landing',
  'strategy',
  'analysis',
  'marketing',
  'content',
  'sales',
] as const;

export type RealWorkTaskType = (typeof REAL_WORK_TASK_TYPES)[number];

export const REAL_WORK_TASK_LABELS: Record<RealWorkTaskType, string> = {
  presentation: 'Презентация',
  landing: 'Лендинг',
  strategy: 'Стратегия',
  analysis: 'Анализ',
  marketing: 'Маркетинг',
  content: 'Контент',
  sales: 'Продажи',
};

const TASK_TYPE_PATTERNS: { type: RealWorkTaskType; patterns: string[] }[] = [
  { type: 'presentation', patterns: ['презент', 'слайд', 'pitch', 'presentation', 'дек'] },
  { type: 'landing', patterns: ['лендинг', 'landing', 'посадочн', 'сайт', 'страниц'] },
  { type: 'strategy', patterns: ['стратег', 'strategy', 'go-to-market', 'gtm', 'план рост'] },
  { type: 'analysis', patterns: ['анализ', 'разобра', 'аудит', 'analysis', 'слаб', 'диагност'] },
  { type: 'marketing', patterns: ['маркет', 'реклам', 'кампан', 'marketing', 'продвиж'] },
  { type: 'content', patterns: ['контент', 'пост', 'текст', 'content', 'блог', 'рассыл'] },
  { type: 'sales', patterns: ['продаж', 'скрипт', 'воронк', 'sales', 'лид', 'клиент'] },
];

const QUICK_ACTION_TASK_TYPE: Record<HomeQuickActionId, RealWorkTaskType> = {
  analysis: 'analysis',
  debug: 'analysis',
  plan: 'strategy',
};

type ClarificationRule = {
  id: string;
  patterns: string[];
  question: string;
};

const CLARIFICATION_RULES: Record<RealWorkTaskType, ClarificationRule[]> = {
  presentation: [
    {
      id: 'audience',
      patterns: ['аудитор', 'инвестор', 'клиент', 'команд', 'для кого', 'ceo', 'партнёр'],
      question: 'Для кого эта презентация?',
    },
    {
      id: 'topic',
      patterns: ['продукт', 'услуг', 'проект', 'стартап', 'компани', 'бренд', 'оффер'],
      question: 'О чём главный слайд — продукт, идея или результат?',
    },
    {
      id: 'goal',
      patterns: ['продать', 'привлеч', 'защит', 'соглас', 'встреч', 'инвест', 'подпис'],
      question: 'Какой результат нужен после показа?',
    },
  ],
  landing: [
    {
      id: 'audience',
      patterns: ['аудитор', 'клиент', 'покупател', 'сегмент', 'для кого', 'b2b', 'b2c'],
      question: 'Кто ваша целевая аудитория?',
    },
    {
      id: 'offer',
      patterns: ['продукт', 'услуг', 'оффер', 'курс', 'приложен', 'сервис', 'предлага'],
      question: 'Что именно вы предлагаете на странице?',
    },
    {
      id: 'cta',
      patterns: ['заявк', 'регистрац', 'покуп', 'звон', 'демо', 'запис', 'cta', 'кнопк'],
      question: 'Какое главное действие должен сделать посетитель?',
    },
  ],
  strategy: [
    {
      id: 'business',
      patterns: ['бизнес', 'компани', 'продукт', 'стартап', 'проект', 'ниш'],
      question: 'Кратко опишите бизнес или продукт.',
    },
    {
      id: 'horizon',
      patterns: ['месяц', 'квартал', 'год', 'недел', 'срок', '202', 'горизонт'],
      question: 'На какой срок нужна стратегия?',
    },
    {
      id: 'priority',
      patterns: ['рост', 'выруч', 'клиент', 'запуск', 'масштаб', 'прибыл', 'удержан'],
      question: 'Что сейчас важнее всего — рост, запуск или удержание?',
    },
  ],
  analysis: [
    {
      id: 'subject',
      patterns: ['продукт', 'воронк', 'маркет', 'продаж', 'команд', 'процесс', 'сайт', 'оффер'],
      question: 'Что именно нужно разобрать?',
    },
    {
      id: 'pain',
      patterns: ['проблем', 'слаб', 'падает', 'не работ', 'мало', 'дорог', 'конверс'],
      question: 'Что сейчас больше всего беспокоит?',
    },
    {
      id: 'context',
      patterns: ['рынок', 'конкурент', 'аудитор', 'этап', 'ниш', 'сегмент'],
      question: 'Есть ли контекст — рынок, этап или аудитория?',
    },
  ],
  marketing: [
    {
      id: 'product',
      patterns: ['продукт', 'услуг', 'бренд', 'курс', 'приложен', 'сервис', 'оффер'],
      question: 'Что продвигаем?',
    },
    {
      id: 'audience',
      patterns: ['аудитор', 'клиент', 'сегмент', 'для кого', 'b2b', 'b2c', 'ниш'],
      question: 'Кому адресована кампания?',
    },
    {
      id: 'channel',
      patterns: ['telegram', 'instagram', 'linkedin', 'email', 'реклам', 'соцсет', 'канал'],
      question: 'Есть ли предпочтительные каналы?',
    },
  ],
  content: [
    {
      id: 'topic',
      patterns: ['тема', 'продукт', 'эксперт', 'ниш', 'бренд', 'курс', 'услуг'],
      question: 'О чём должен быть контент?',
    },
    {
      id: 'format',
      patterns: ['пост', 'стать', 'видео', 'рассыл', 'сторис', 'блог', 'reels', 'подкаст'],
      question: 'Какой формат важнее — посты, статьи или видео?',
    },
    {
      id: 'cadence',
      patterns: ['недел', 'месяц', 'ежеднев', 'регуляр', 'план', 'серия'],
      question: 'На какой период нужен контент-план?',
    },
  ],
  sales: [
    {
      id: 'offer',
      patterns: ['продукт', 'услуг', 'оффер', 'тариф', 'пакет', 'решени'],
      question: 'Что именно продаём?',
    },
    {
      id: 'audience',
      patterns: ['клиент', 'лид', 'аудитор', 'сегмент', 'b2b', 'b2c', 'покупател'],
      question: 'Кому звоним или пишем?',
    },
    {
      id: 'stage',
      patterns: ['холодн', 'входящ', 'демо', 'переговор', 'закрыт', 'воронк', 'follow'],
      question: 'На каком этапе воронки нужен скрипт?',
    },
  ],
};

const MIN_PROMPT_WORDS = 14;

export function classifyRealWorkTaskType(
  prompt: string,
  quickActionId?: HomeQuickActionId,
): RealWorkTaskType {
  if (quickActionId) {
    return QUICK_ACTION_TASK_TYPE[quickActionId];
  }

  const haystack = normalizeOsaText(prompt);

  for (const rule of TASK_TYPE_PATTERNS) {
    if (matchesAnyOsaPattern(haystack, rule.patterns)) {
      return rule.type;
    }
  }

  return 'analysis';
}

export function mapTaskTypeToDeliverableType(taskType: RealWorkTaskType): DeliverableType {
  switch (taskType) {
    case 'presentation':
      return 'presentation';
    case 'landing':
      return 'landing';
    case 'strategy':
      return 'business_strategy';
    case 'analysis':
      return 'business_strategy';
    case 'marketing':
      return 'marketing_plan';
    case 'content':
      return 'content_plan';
    case 'sales':
      return 'sales_script';
  }
}

export function mapTaskTypeToProjectType(taskType: RealWorkTaskType): ProjectType {
  switch (taskType) {
    case 'marketing':
    case 'content':
    case 'landing':
      return 'marketing';
    case 'sales':
      return 'crm';
    case 'analysis':
      return 'finance';
    default:
      return 'general';
  }
}

export function buildClarificationQuestions(
  taskType: RealWorkTaskType,
  prompt: string,
): string[] {
  const haystack = normalizeOsaText(prompt);
  const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount >= MIN_PROMPT_WORDS) {
    return [];
  }

  const questions = CLARIFICATION_RULES[taskType]
    .filter((rule) => !matchesAnyOsaPattern(haystack, rule.patterns))
    .map((rule) => rule.question);

  return questions.slice(0, 3);
}

export function needsClarification(prompt: string, taskType: RealWorkTaskType): boolean {
  return buildClarificationQuestions(taskType, prompt).length > 0;
}

export type ClarificationAnswer = {
  question: string;
  answer: string;
};

export function buildEnrichedRealWorkPrompt(
  prompt: string,
  taskType: RealWorkTaskType,
  clarifications: ClarificationAnswer[] = [],
): string {
  const trimmed = prompt.trim();
  const label = REAL_WORK_TASK_LABELS[taskType];
  const answers = clarifications
    .map((entry) => entry.answer.trim())
    .filter(Boolean)
    .map((answer, index) => `${index + 1}. ${answer}`);

  const sections = [
    `Тип задачи: ${label}.`,
    `Запрос:\n${trimmed}`,
  ];

  if (answers.length > 0) {
    sections.push(`Уточнения:\n${answers.join('\n')}`);
  }

  sections.push('Нужен готовый рабочий результат, а не общие рекомендации.');

  return sections.join('\n\n');
}

export function serializeHomeDeliverable(input: {
  id: string;
  type: DeliverableType;
  title: string;
  summary: string;
  content: string;
  currentVersion: number;
  agentRole: string;
}) {
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    summary: input.summary,
    content: input.content,
    currentVersion: input.currentVersion,
    agentRole: input.agentRole,
    versionLabel: `v${input.currentVersion} Ready`,
  };
}

export type HomeDeliverablePayload = ReturnType<typeof serializeHomeDeliverable>;
