import {
  buildNavigatorRecommendation,
  type NavigatorRecommendation,
  type NavigatorTeamCategory,
} from '@/utils/osa/navigator-engine';

export type OsaAgentId =
  | 'business-manager'
  | 'marketing'
  | 'crm'
  | 'analyst'
  | 'estate'
  | 'mlm'
  | 'content';

export type OsaAgentDefinition = {
  id: OsaAgentId;
  name: string;
  description: string;
  workspaceStatus: string;
};

export type OsaTeamRecommendation = {
  team: OsaAgentDefinition[];
  recommendation: NavigatorRecommendation;
};

const AGENT_CATALOG: Record<OsaAgentId, OsaAgentDefinition> = {
  'business-manager': {
    id: 'business-manager',
    name: 'AI Business Manager',
    description: 'Координирует остальных агентов.',
    workspaceStatus: 'Работает',
  },
  marketing: {
    id: 'marketing',
    name: 'AI Marketing',
    description: 'Создаёт рекламу, посты и контент.',
    workspaceStatus: 'Готовит стратегию',
  },
  crm: {
    id: 'crm',
    name: 'AI CRM',
    description: 'Ведёт клиентов и напоминает о следующих шагах.',
    workspaceStatus: 'Создаёт карточку клиента',
  },
  analyst: {
    id: 'analyst',
    name: 'AI Analyst',
    description: 'Анализирует эффективность и предлагает улучшения.',
    workspaceStatus: 'Считает показатели',
  },
  estate: {
    id: 'estate',
    name: 'AI Estate',
    description: 'Подбирает недвижимость и рассчитывает инвестиции.',
    workspaceStatus: 'Анализирует объекты',
  },
  mlm: {
    id: 'mlm',
    name: 'AI MLM',
    description: 'Помогает с рекрутингом, контентом и обработкой возражений.',
    workspaceStatus: 'Готовит рекрутинговую систему',
  },
  content: {
    id: 'content',
    name: 'AI Content',
    description: 'Создаёт посты, сценарии, видео и публикации.',
    workspaceStatus: 'Создаёт контент-план',
  },
};

const CATEGORY_AGENT_MAP: Record<NavigatorTeamCategory, OsaAgentId[]> = {
  Marketing: ['marketing'],
  Sales: ['crm'],
  Content: ['content', 'marketing'],
  Development: ['analyst'],
  Analytics: ['analyst'],
  Automation: ['analyst', 'business-manager'],
  Research: ['analyst', 'estate'],
  Support: ['crm'],
  Operations: ['business-manager'],
};

const SPECIAL_AGENT_RULES: Array<{
  agentId: OsaAgentId;
  patterns: string[];
}> = [
  {
    agentId: 'estate',
    patterns: [
      'недвижим',
      'новострой',
      'ипотек',
      'инвест-брокер',
      'инвест брокер',
      'квартир',
      'риелтор',
      'риэлтор',
    ],
  },
  {
    agentId: 'mlm',
    patterns: ['сетевик', 'mlm', 'млм', 'famall', 'рекрутинг', 'рекрут', 'network marketing'],
  },
];

function normalizeInput(input: string): string {
  return input.trim().toLowerCase();
}

function resolveAgentsForCategories(categories: NavigatorTeamCategory[]): OsaAgentId[] {
  const agentIds: OsaAgentId[] = ['business-manager'];

  for (const category of categories) {
    for (const agentId of CATEGORY_AGENT_MAP[category]) {
      agentIds.push(agentId);
    }
  }

  return agentIds;
}

function resolveSpecialAgents(userInput: string): OsaAgentId[] {
  const text = ` ${normalizeInput(userInput)} `;
  const agentIds: OsaAgentId[] = [];

  for (const rule of SPECIAL_AGENT_RULES) {
    if (
      rule.patterns.some((pattern) => {
        const normalizedPattern = pattern.trim().toLowerCase();
        if (normalizedPattern.length <= 4) {
          return new RegExp(
            `(?:^|\\s)${normalizedPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$|[.,!?;:])`,
          ).test(text);
        }
        return text.includes(normalizedPattern);
      })
    ) {
      agentIds.push(rule.agentId);
    }
  }

  return agentIds;
}

function dedupeAgents(agentIds: OsaAgentId[]): OsaAgentDefinition[] {
  const seen = new Set<OsaAgentId>();
  const team: OsaAgentDefinition[] = [];

  for (const agentId of agentIds) {
    if (seen.has(agentId)) {
      continue;
    }

    seen.add(agentId);
    team.push(AGENT_CATALOG[agentId]);
  }

  return team;
}

const CORE_AGENT_IDS: OsaAgentId[] = ['business-manager', 'marketing', 'crm', 'analyst'];

export function mapNavigatorRecommendationToOsaTeam(
  userInput: string,
  recommendation: NavigatorRecommendation,
): OsaAgentDefinition[] {
  const selectedCategories = [...recommendation.primaryTeam, ...recommendation.secondaryTeam];

  const mappedAgents = resolveAgentsForCategories(selectedCategories);
  const specialAgents = resolveSpecialAgents(userInput);

  return dedupeAgents([...CORE_AGENT_IDS, ...mappedAgents, ...specialAgents]);
}

export function getOsaTeamRecommendation(userInput: string): OsaTeamRecommendation {
  const recommendation = buildNavigatorRecommendation(userInput);

  return {
    recommendation,
    team: mapNavigatorRecommendationToOsaTeam(userInput, recommendation),
  };
}

export function recommendOsaTeam(userInput: string): OsaAgentDefinition[] {
  return getOsaTeamRecommendation(userInput).team;
}

export const OSA_ONBOARDING_EXAMPLES = [
  'Я инвест-брокер и хочу больше клиентов',
  'Я стоматолог и устал отвечать в WhatsApp',
  'Я сетевик и хочу автоматизировать рекрутинг',
  'Я директор завода и хочу сократить рутину',
] as const;
