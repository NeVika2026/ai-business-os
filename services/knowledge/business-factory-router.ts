import {
  BUSINESS_FACTORY_KNOWLEDGE_METHODS,
  getBusinessFactoryKnowledgeSource,
  type BusinessFactoryKnowledgeMethod,
} from '@/services/knowledge/business-factory-knowledge';

export type RoutedBusinessFactoryMethod = {
  id: string;
  title: string;
  category: BusinessFactoryKnowledgeMethod['category'];
  summary: string;
  whenToUse: string;
  tags: string[];
  sourceTitles: string[];
  freshness: 'stable' | 'time-sensitive';
  guardrails: string[];
  score: number;
  matchedKeywords: string[];
};

export type RouteBusinessFactoryKnowledgeInput = {
  query: string;
  selectedAgentIds?: string[];
  limit?: number;
};

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length > 1),
  );
}

function normalizedLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit) || limit <= 0) {
    return 5;
  }

  return Math.min(Math.floor(limit), 8);
}

function scoreMethod(
  method: BusinessFactoryKnowledgeMethod,
  normalizedQuery: string,
  queryTokens: Set<string>,
  selectedAgentIds: Set<string>,
): { score: number; matchedKeywords: string[] } {
  let score = 0;
  const matchedKeywords: string[] = [];

  const title = normalize(method.title);
  if (title && normalizedQuery.includes(title)) {
    score += 12;
  }

  for (const keyword of method.keywords) {
    const normalizedKeyword = normalize(keyword);
    if (!normalizedKeyword) {
      continue;
    }

    if (normalizedQuery.includes(normalizedKeyword)) {
      score += normalizedKeyword.includes(' ') ? 7 : 4;
      matchedKeywords.push(keyword);
      continue;
    }

    const keywordTokens = normalizedKeyword.split(' ').filter(Boolean);
    const overlap = keywordTokens.filter((token) => queryTokens.has(token)).length;
    if (overlap > 0 && overlap === keywordTokens.length) {
      score += Math.max(2, overlap * 2);
      matchedKeywords.push(keyword);
    }
  }

  for (const tag of method.tags) {
    const normalizedTag = normalize(tag);
    if (normalizedTag && normalizedQuery.includes(normalizedTag)) {
      score += 2;
    }
  }

  if (method.agentIds.some((agentId) => selectedAgentIds.has(agentId))) {
    score += 2;
  }

  return {
    score,
    matchedKeywords: [...new Set(matchedKeywords)],
  };
}

function toRoutedMethod(
  method: BusinessFactoryKnowledgeMethod,
  score: number,
  matchedKeywords: string[],
): RoutedBusinessFactoryMethod {
  const sources = method.sourceIds
    .map((sourceId) => getBusinessFactoryKnowledgeSource(sourceId))
    .filter((source): source is NonNullable<typeof source> => Boolean(source));

  return {
    id: method.id,
    title: method.title,
    category: method.category,
    summary: method.summary,
    whenToUse: method.whenToUse,
    tags: [...method.tags],
    sourceTitles: sources.map((source) => source.title),
    freshness: sources.some((source) => source.freshness === 'time-sensitive')
      ? 'time-sensitive'
      : 'stable',
    guardrails: [...(method.guardrails ?? [])],
    score,
    matchedKeywords,
  };
}

export function routeBusinessFactoryKnowledge(
  input: RouteBusinessFactoryKnowledgeInput,
): RoutedBusinessFactoryMethod[] {
  const normalizedQuery = normalize(input.query ?? '');
  if (!normalizedQuery) {
    return [];
  }

  const queryTokens = tokenize(normalizedQuery);
  const selectedAgentIds = new Set(
    (input.selectedAgentIds ?? []).map((agentId) => agentId.trim()).filter(Boolean),
  );

  return BUSINESS_FACTORY_KNOWLEDGE_METHODS.map((method) => {
    const result = scoreMethod(method, normalizedQuery, queryTokens, selectedAgentIds);
    return toRoutedMethod(method, result.score, result.matchedKeywords);
  })
    .filter((method) => method.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.id.localeCompare(right.id, 'ru');
    })
    .slice(0, normalizedLimit(input.limit));
}

export function serializeBusinessFactoryKnowledgeForRuntime(
  methods: RoutedBusinessFactoryMethod[],
): Array<Record<string, unknown>> {
  return methods.map((method) => ({
    id: method.id,
    title: method.title,
    category: method.category,
    summary: method.summary,
    when_to_use: method.whenToUse,
    tags: method.tags,
    source_titles: method.sourceTitles,
    freshness: method.freshness,
    guardrails: method.guardrails,
    match_score: method.score,
    matched_keywords: method.matchedKeywords,
  }));
}
