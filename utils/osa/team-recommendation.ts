import {
  getCoreOsaAgents,
  getOsaAgentById,
  resolveOsaAgents,
  toOsaAgentDefinition,
  type OsaAgentDefinition,
  type OsaAgentId,
} from '@/utils/osa/agent-registry';
import {
  buildNavigatorRecommendation,
  type NavigatorRecommendation,
  type NavigatorTeamCategory,
} from '@/utils/osa/navigator-engine';

export type { OsaAgentDefinition, OsaAgentId } from '@/utils/osa/agent-registry';

export type OsaTeamRecommendation = {
  team: OsaAgentDefinition[];
  recommendation: NavigatorRecommendation;
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
  return resolveOsaAgents(agentIds).map(toOsaAgentDefinition);
}

export function mapNavigatorRecommendationToOsaTeam(
  userInput: string,
  recommendation: NavigatorRecommendation,
): OsaAgentDefinition[] {
  const selectedCategories = [...recommendation.primaryTeam, ...recommendation.secondaryTeam];

  const mappedAgents = resolveAgentsForCategories(selectedCategories);
  const specialAgents = resolveSpecialAgents(userInput);
  const coreAgentIds = getCoreOsaAgents().map((agent) => agent.id);

  return dedupeAgents([...coreAgentIds, ...mappedAgents, ...specialAgents]);
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

export function getOsaAgentDefinitionById(id: string): OsaAgentDefinition | undefined {
  const agent = getOsaAgentById(id);
  return agent ? toOsaAgentDefinition(agent) : undefined;
}

export const OSA_ONBOARDING_EXAMPLES = [
  'Я инвест-брокер и хочу больше клиентов',
  'Я стоматолог и устал отвечать в WhatsApp',
  'Я сетевик и хочу автоматизировать рекрутинг',
  'Я директор завода и хочу сократить рутину',
] as const;
