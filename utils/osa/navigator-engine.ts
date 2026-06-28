import { matchesOsaPattern, normalizeOsaText } from '@/utils/osa/text-matching';

export const NAVIGATOR_TEAM_CATEGORIES = [
  'Marketing',
  'Sales',
  'Content',
  'Development',
  'Analytics',
  'Automation',
  'Research',
  'Support',
  'Operations',
] as const;

export type NavigatorTeamCategory = (typeof NAVIGATOR_TEAM_CATEGORIES)[number];

export type NavigatorSignals = {
  profession: string[];
  businessType: string[];
  goal: string[];
  requestedOutcome: string[];
  painPoints: string[];
  urgency: string[];
  complexity: string[];
  requestedDeliverable: string[];
};

export type NavigatorRecommendation = {
  primaryTeam: NavigatorTeamCategory[];
  secondaryTeam: NavigatorTeamCategory[];
  confidence: number;
  reasoning: string[];
  tags: string[];
  needsNavigatorReview: boolean;
  scores: Record<NavigatorTeamCategory, number>;
  signals: NavigatorSignals;
};

type SignalRule = {
  label: string;
  tag: string;
  field: keyof NavigatorSignals;
  patterns: string[];
};

type CategoryRule = {
  category: NavigatorTeamCategory;
  baseWeight: number;
  signalWeights: Partial<Record<keyof NavigatorSignals, number>>;
  keywordPatterns: string[];
  keywordWeight: number;
};

const SIGNAL_RULES: SignalRule[] = [
  {
    label: 'Стоматология',
    tag: 'profession:dentistry',
    field: 'profession',
    patterns: ['стоматолог', 'зубн', 'клиник', 'dentist'],
  },
  {
    label: 'Недвижимость',
    tag: 'profession:real-estate',
    field: 'profession',
    patterns: ['риелтор', 'риэлтор', 'брокер', 'недвижим', 'realtor'],
  },
  {
    label: 'Сетевой маркетинг',
    tag: 'profession:network-marketing',
    field: 'profession',
    patterns: ['сетевик', 'mlm', 'млм', 'network marketing'],
  },
  {
    label: 'Производство',
    tag: 'profession:manufacturing',
    field: 'profession',
    patterns: ['завод', 'производств', 'директор завода', 'manufacturing'],
  },
  {
    label: 'E-commerce',
    tag: 'business:ecommerce',
    field: 'businessType',
    patterns: ['интернет-магазин', 'e-commerce', 'ecommerce', 'маркетплейс', 'ozon', 'wildberries'],
  },
  {
    label: 'B2B',
    tag: 'business:b2b',
    field: 'businessType',
    patterns: ['b2b', 'корпоратив', 'оптов', 'enterprise'],
  },
  {
    label: 'B2C',
    tag: 'business:b2c',
    field: 'businessType',
    patterns: ['b2c', 'розниц', 'магазин', 'услуг для клиентов'],
  },
  {
    label: 'SaaS',
    tag: 'business:saas',
    field: 'businessType',
    patterns: ['saas', 'подпис', 'сервис', 'платформ'],
  },
  {
    label: 'Привлечение клиентов',
    tag: 'goal:acquire-clients',
    field: 'goal',
    patterns: ['больше клиентов', 'привлеч', 'лидов', 'lead', 'заявк', 'продаж'],
  },
  {
    label: 'Автоматизация',
    tag: 'goal:automation',
    field: 'goal',
    patterns: ['автоматиз', 'рутин', 'сократить ручн', 'оптимиз'],
  },
  {
    label: 'Рост выручки',
    tag: 'goal:revenue',
    field: 'goal',
    patterns: ['выручк', 'доход', 'продаж', 'revenue', 'конверси'],
  },
  {
    label: 'Контент-стратегия',
    tag: 'goal:content',
    field: 'goal',
    patterns: ['контент', 'публикац', 'блог', 'reels', 'shorts', 'telegram', 'телеграм'],
  },
  {
    label: 'Аналитика',
    tag: 'goal:analytics',
    field: 'goal',
    patterns: ['анализ', 'метрик', 'отчет', 'дашборд', 'kpi', 'эффективност'],
  },
  {
    label: 'План действий',
    tag: 'outcome:action-plan',
    field: 'requestedOutcome',
    patterns: ['план', 'дорожн', 'стратег', 'roadmap'],
  },
  {
    label: 'Система процессов',
    tag: 'outcome:system',
    field: 'requestedOutcome',
    patterns: ['систем', 'процесс', 'воронк', 'pipeline'],
  },
  {
    label: 'Перегрузка сообщениями',
    tag: 'pain:inbox-overload',
    field: 'painPoints',
    patterns: ['whatsapp', 'вотсап', 'сообщен', 'отвечать', 'переписк'],
  },
  {
    label: 'Нехватка времени',
    tag: 'pain:time-pressure',
    field: 'painPoints',
    patterns: ['устал', 'не хватает времени', 'перегруз', 'завал'],
  },
  {
    label: 'Потеря лидов',
    tag: 'pain:lead-loss',
    field: 'painPoints',
    patterns: ['теря', 'забыва', 'не дозвон', 'не отвеча'],
  },
  {
    label: 'Срочность',
    tag: 'urgency:high',
    field: 'urgency',
    patterns: ['срочно', 'сегодня', 'завтра', 'asap', 'быстро', 'немедленно'],
  },
  {
    label: 'Долгий цикл',
    tag: 'complexity:high',
    field: 'complexity',
    patterns: ['сложн', 'много этап', 'долгий цикл', 'enterprise', 'крупн'],
  },
  {
    label: 'Простая задача',
    tag: 'complexity:low',
    field: 'complexity',
    patterns: ['прост', 'быстрый старт', 'mvp', 'пилот'],
  },
  {
    label: 'Кампания',
    tag: 'deliverable:campaign',
    field: 'requestedDeliverable',
    patterns: ['кампани', 'реклам', 'таргет', 'ads', 'промо'],
  },
  {
    label: 'Контент-план',
    tag: 'deliverable:content-plan',
    field: 'requestedDeliverable',
    patterns: ['контент-план', 'пост', 'сценари', 'видео', 'публикац'],
  },
  {
    label: 'CRM / клиентская база',
    tag: 'deliverable:crm',
    field: 'requestedDeliverable',
    patterns: ['crm', 'карточк клиент', 'база клиент', 'воронк'],
  },
  {
    label: 'Отчёт / аналитика',
    tag: 'deliverable:report',
    field: 'requestedDeliverable',
    patterns: ['отчет', 'отчёт', 'аналит', 'дашборд', 'метрик'],
  },
  {
    label: 'Разработка / интеграция',
    tag: 'deliverable:development',
    field: 'requestedDeliverable',
    patterns: ['разработ', 'интеграц', 'api', 'бот', 'сайт', 'приложен'],
  },
];

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Marketing',
    baseWeight: 4,
    signalWeights: {
      goal: 12,
      requestedOutcome: 10,
      requestedDeliverable: 14,
      businessType: 6,
      urgency: 4,
    },
    keywordPatterns: [
      'маркетинг',
      'реклам',
      'продвижен',
      'таргет',
      'лид',
      'клиент',
      'instagram',
      'вконтакте',
      'vk',
      'brand',
    ],
    keywordWeight: 8,
  },
  {
    category: 'Sales',
    baseWeight: 4,
    signalWeights: {
      goal: 14,
      painPoints: 12,
      requestedDeliverable: 12,
      profession: 8,
      urgency: 6,
    },
    keywordPatterns: [
      'продаж',
      'сделк',
      'воронк',
      'crm',
      'клиент',
      'заявк',
      'конверси',
      'менеджер по продажам',
    ],
    keywordWeight: 8,
  },
  {
    category: 'Content',
    baseWeight: 3,
    signalWeights: {
      goal: 16,
      requestedDeliverable: 16,
      businessType: 4,
    },
    keywordPatterns: [
      'контент',
      'пост',
      'блог',
      'reels',
      'shorts',
      'telegram',
      'телеграм',
      'видео',
      'сценари',
    ],
    keywordWeight: 10,
  },
  {
    category: 'Development',
    baseWeight: 2,
    signalWeights: {
      requestedDeliverable: 18,
      complexity: 8,
      businessType: 6,
    },
    keywordPatterns: [
      'разработ',
      'код',
      'api',
      'интеграц',
      'сайт',
      'приложен',
      'бот',
      'backend',
      'frontend',
    ],
    keywordWeight: 10,
  },
  {
    category: 'Analytics',
    baseWeight: 3,
    signalWeights: {
      goal: 14,
      requestedOutcome: 10,
      requestedDeliverable: 14,
      complexity: 6,
    },
    keywordPatterns: [
      'аналит',
      'метрик',
      'kpi',
      'отчет',
      'отчёт',
      'дашборд',
      'эффективност',
      'показател',
    ],
    keywordWeight: 9,
  },
  {
    category: 'Automation',
    baseWeight: 4,
    signalWeights: {
      goal: 16,
      painPoints: 14,
      requestedOutcome: 10,
      complexity: 4,
    },
    keywordPatterns: ['автоматиз', 'рутин', 'workflow', 'процесс', 'интеграц', 'бот', 'триггер'],
    keywordWeight: 9,
  },
  {
    category: 'Research',
    baseWeight: 2,
    signalWeights: {
      profession: 12,
      goal: 8,
      complexity: 8,
      requestedOutcome: 8,
    },
    keywordPatterns: [
      'исслед',
      'анализ рынка',
      'конкурент',
      'ниш',
      'инвест',
      'новострой',
      'ипотек',
      'объект',
    ],
    keywordWeight: 8,
  },
  {
    category: 'Support',
    baseWeight: 3,
    signalWeights: {
      painPoints: 16,
      profession: 10,
      urgency: 8,
    },
    keywordPatterns: [
      'поддержк',
      'ответ',
      'whatsapp',
      'вотсап',
      'чат',
      'обращен',
      'клиентский сервис',
      'helpdesk',
    ],
    keywordWeight: 9,
  },
  {
    category: 'Operations',
    baseWeight: 5,
    signalWeights: {
      goal: 10,
      painPoints: 10,
      complexity: 8,
      requestedOutcome: 8,
    },
    keywordPatterns: [
      'операц',
      'процесс',
      'рутин',
      'завод',
      'производств',
      'управлен',
      'координац',
      'navigator',
    ],
    keywordWeight: 7,
  },
];

const SIGNAL_TAG_CATEGORY_BOOSTS: Record<string, Partial<Record<NavigatorTeamCategory, number>>> = {
  'profession:dentistry': { Support: 18, Operations: 8, Marketing: 6 },
  'profession:real-estate': { Sales: 16, Research: 18, Marketing: 10 },
  'profession:network-marketing': { Sales: 14, Content: 12, Marketing: 14, Automation: 8 },
  'profession:manufacturing': { Operations: 18, Automation: 14, Analytics: 8 },
  'business:ecommerce': { Marketing: 12, Sales: 10, Analytics: 8, Content: 8 },
  'business:b2b': { Sales: 12, Analytics: 10, Operations: 8 },
  'business:b2c': { Marketing: 10, Support: 8, Content: 8 },
  'business:saas': { Development: 12, Marketing: 10, Support: 8, Analytics: 8 },
  'goal:acquire-clients': { Marketing: 16, Sales: 14 },
  'goal:automation': { Automation: 18, Operations: 12, Development: 8 },
  'goal:revenue': { Sales: 16, Marketing: 12, Analytics: 8 },
  'goal:content': { Content: 18, Marketing: 10 },
  'goal:analytics': { Analytics: 18, Research: 8 },
  'outcome:action-plan': { Operations: 10, Analytics: 8, Marketing: 6 },
  'outcome:system': { Operations: 12, Automation: 14, Development: 8 },
  'pain:inbox-overload': { Support: 18, Automation: 12, Sales: 6 },
  'pain:time-pressure': { Automation: 14, Operations: 12, Support: 8 },
  'pain:lead-loss': { Sales: 16, Support: 10, Automation: 8 },
  'urgency:high': { Operations: 8, Support: 8, Sales: 6 },
  'complexity:high': { Operations: 10, Analytics: 10, Development: 8 },
  'complexity:low': { Content: 8, Marketing: 8 },
  'deliverable:campaign': { Marketing: 18, Content: 8 },
  'deliverable:content-plan': { Content: 18, Marketing: 10 },
  'deliverable:crm': { Sales: 18, Support: 8, Automation: 6 },
  'deliverable:report': { Analytics: 18, Research: 10 },
  'deliverable:development': { Development: 20, Automation: 10 },
};

function createEmptySignals(): NavigatorSignals {
  return {
    profession: [],
    businessType: [],
    goal: [],
    requestedOutcome: [],
    painPoints: [],
    urgency: [],
    complexity: [],
    requestedDeliverable: [],
  };
}

function createEmptyScores(): Record<NavigatorTeamCategory, number> {
  return NAVIGATOR_TEAM_CATEGORIES.reduce(
    (scores, category) => {
      scores[category] = 0;
      return scores;
    },
    {} as Record<NavigatorTeamCategory, number>,
  );
}

export function normalizeNavigatorInput(input: string): string {
  return normalizeOsaText(input);
}

function matchesPattern(text: string, pattern: string): boolean {
  return matchesOsaPattern(text, pattern);
}

export function analyzeNavigatorInput(userInput: string): {
  signals: NavigatorSignals;
  tags: string[];
  reasoning: string[];
} {
  const text = normalizeNavigatorInput(userInput);
  const signals = createEmptySignals();
  const tags: string[] = [];
  const reasoning: string[] = [];

  for (const rule of SIGNAL_RULES) {
    const matched = rule.patterns.some((pattern) => matchesPattern(text, pattern));

    if (!matched) {
      continue;
    }

    signals[rule.field].push(rule.label);
    tags.push(rule.tag);
    reasoning.push(`Обнаружен сигнал: ${rule.label}`);
  }

  if (tags.length === 0) {
    reasoning.push('Явные сигналы не найдены — используется базовый анализ запроса');
  }

  return { signals, tags, reasoning };
}

function scoreCategory(
  rule: CategoryRule,
  text: string,
  signals: NavigatorSignals,
  tags: string[],
): number {
  let score = rule.baseWeight;

  for (const [field, weight] of Object.entries(rule.signalWeights) as Array<
    [keyof NavigatorSignals, number]
  >) {
    score += signals[field].length * weight;
  }

  for (const pattern of rule.keywordPatterns) {
    if (matchesPattern(text, pattern)) {
      score += rule.keywordWeight;
    }
  }

  for (const tag of tags) {
    const boost = SIGNAL_TAG_CATEGORY_BOOSTS[tag]?.[rule.category];

    if (boost) {
      score += boost;
    }
  }

  return score;
}

export function scoreNavigatorTeams(
  userInput: string,
  signals: NavigatorSignals,
  tags: string[],
): Record<NavigatorTeamCategory, number> {
  const text = normalizeNavigatorInput(userInput);
  const scores = createEmptyScores();

  for (const rule of CATEGORY_RULES) {
    scores[rule.category] = scoreCategory(rule, text, signals, tags);
  }

  return scores;
}

function getRankedTeams(
  scores: Record<NavigatorTeamCategory, number>,
): Array<{ category: NavigatorTeamCategory; score: number }> {
  return NAVIGATOR_TEAM_CATEGORIES.map((category) => ({
    category,
    score: scores[category],
  })).sort((left, right) => right.score - left.score);
}

function calculateConfidence(
  ranked: Array<{ category: NavigatorTeamCategory; score: number }>,
  tagCount: number,
): number {
  const topScore = ranked[0]?.score ?? 0;
  const secondScore = ranked[1]?.score ?? 0;
  const gap = topScore - secondScore;

  let confidence = 28;
  confidence += Math.min(topScore, 40);
  confidence += Math.min(gap * 2, 20);
  confidence += Math.min(tagCount * 4, 16);

  if (topScore === 0) {
    confidence = 35;
  }

  if (tagCount === 0) {
    confidence -= 12;
  }

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

export function buildNavigatorRecommendation(userInput: string): NavigatorRecommendation {
  const { signals, tags, reasoning } = analyzeNavigatorInput(userInput);
  const scores = scoreNavigatorTeams(userInput, signals, tags);
  const ranked = getRankedTeams(scores);
  const topScore = ranked[0]?.score ?? 0;
  const secondScore = ranked[1]?.score ?? 0;
  const confidence = calculateConfidence(ranked, tags.length);

  const primaryTeam = ranked
    .filter((entry) => entry.score === topScore && entry.score > 0)
    .map((entry) => entry.category);

  const secondaryTeam: NavigatorTeamCategory[] = [];

  if (topScore > 0 && secondScore > 0 && topScore - secondScore < 10) {
    const secondTierScore = secondScore;

    for (const entry of ranked) {
      if (entry.score === secondTierScore && !primaryTeam.includes(entry.category)) {
        secondaryTeam.push(entry.category);
      }
    }
  }

  if (primaryTeam.length > 0) {
    reasoning.push(`Основная команда: ${primaryTeam.join(', ')} (score ${topScore})`);
  } else {
    reasoning.push('Основная команда не определена — рекомендуется Navigator review');
  }

  if (secondaryTeam.length > 0) {
    reasoning.push(`Дополнительная команда: ${secondaryTeam.join(', ')} (разница score < 10)`);
  }

  const needsNavigatorReview = confidence < 55;

  if (needsNavigatorReview) {
    reasoning.push('Confidence ниже 55 — рекомендуется проверка Navigator');
  }

  return {
    primaryTeam: primaryTeam.length > 0 ? primaryTeam : (['Operations'] as NavigatorTeamCategory[]),
    secondaryTeam,
    confidence,
    reasoning,
    tags,
    needsNavigatorReview,
    scores,
    signals,
  };
}
