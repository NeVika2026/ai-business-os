import type { ProjectType } from '@/utils/projects/project-types';
import { PROJECT_TYPE_LABELS } from '@/utils/projects/project-types';
import { matchesOsaPattern, normalizeOsaText } from '@/utils/osa/text-matching';

type TypeRule = {
  type: ProjectType;
  patterns: string[];
};

const TYPE_RULES: TypeRule[] = [
  {
    type: 'marketing',
    patterns: ['маркет', 'реклам', 'контент', 'пост', 'бренд', 'marketing', 'campaign'],
  },
  {
    type: 'crm',
    patterns: ['crm', 'клиент', 'лид', 'lead', 'продаж', 'sales', 'воронк'],
  },
  {
    type: 'finance',
    patterns: ['финанс', 'бюджет', 'выруч', 'revenue', 'finance', 'отчёт'],
  },
  {
    type: 'automation',
    patterns: ['автомат', 'workflow', 'процесс', 'integration', 'automation'],
  },
  {
    type: 'knowledge',
    patterns: ['база знан', 'knowledge', 'документ', 'wiki', 'обуч'],
  },
  {
    type: 'estate',
    patterns: ['недвиж', 'estate', 'квартир', 'real estate', 'объект'],
  },
  {
    type: 'mlm',
    patterns: ['mlm', 'сеть', 'network marketing', 'рекрут'],
  },
];

export function detectProjectType(input: {
  declaredType: ProjectType;
  name: string;
  description: string | null;
}): ProjectType {
  if (input.declaredType !== 'general') {
    return input.declaredType;
  }

  const haystack = normalizeOsaText(`${input.name} ${input.description ?? ''}`);

  for (const rule of TYPE_RULES) {
    if (rule.patterns.some((pattern) => matchesOsaPattern(haystack, pattern))) {
      return rule.type;
    }
  }

  return 'general';
}

export function projectTypeLabel(type: ProjectType): string {
  return PROJECT_TYPE_LABELS[type] ?? type;
}
