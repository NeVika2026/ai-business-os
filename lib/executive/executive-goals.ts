import type { ExecutiveGoal } from '@/types/executive';

import { matchesOsaPattern, normalizeOsaText } from '@/utils/osa/text-matching';

type GoalRule = {
  goal: ExecutiveGoal;
  patterns: string[];
};

const GOAL_RULES: GoalRule[] = [
  {
    goal: 'find_clients',
    patterns: [
      'клиент',
      'лид',
      'lead',
      'продаж',
      'привлеч',
      'заявк',
      'find client',
      'acquisition',
    ],
  },
  {
    goal: 'create_content',
    patterns: [
      'контент',
      'пост',
      'стать',
      'видео',
      'youtube',
      'telegram',
      'блог',
      'рассыл',
      'copy',
      'marketing copy',
    ],
  },
  {
    goal: 'business_analysis',
    patterns: [
      'анализ',
      'бизнес',
      'стратег',
      'метрик',
      'аудит',
      'диагност',
      'priorit',
      'выручк',
      'revenue',
      'growth plan',
    ],
  },
  {
    goal: 'design',
    patterns: [
      'проектир',
      'архитектур',
      'систем',
      'дизайн',
      'структур',
      'framework',
      'blueprint',
      'runtime',
      'pipeline',
    ],
  },
  {
    goal: 'learning',
    patterns: [
      'обуч',
      'изуч',
      'как работает',
      'объясни',
      'научи',
      'что такое',
      'explain',
      'learn',
      'tutorial',
    ],
  },
];

export function detectExecutiveGoal(
  userTask: string | null,
  routingIntent?: string | null,
): ExecutiveGoal {
  const haystack = normalizeOsaText(`${routingIntent ?? ''} ${userTask ?? ''}`);

  if (!haystack) {
    return 'other';
  }

  for (const rule of GOAL_RULES) {
    if (rule.patterns.some((pattern) => matchesOsaPattern(haystack, pattern))) {
      return rule.goal;
    }
  }

  return 'other';
}

export function goalLabel(goal: ExecutiveGoal): string {
  switch (goal) {
    case 'find_clients':
      return 'поиск клиентов';
    case 'create_content':
      return 'создание контента';
    case 'business_analysis':
      return 'анализ бизнеса';
    case 'design':
      return 'проектирование';
    case 'learning':
      return 'обучение';
    default:
      return 'другое';
  }
}
