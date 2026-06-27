import { MemoryRetrieverValidationError } from '@/services/memory/memory-retriever-errors';
import {
  serializeMemoryRetrieverRankResult,
  serializeMemoryRetrieverResult,
  serializeMemoryRetrieverSnapshot,
} from '@/services/memory/memory-retriever-serializer';
import type {
  MemoryEntity,
  MemoryFact,
  MemoryRelation,
} from '@/services/memory/memory-engine-types';
import type {
  MemoryRetrieverInput,
  MemoryRetrieverOptions,
  MemoryRetrieverRankResult,
  MemoryRetrieverRankedEntity,
  MemoryRetrieverRankedFact,
  MemoryRetrieverRankedRelation,
  MemoryRetrieverResult,
  MemoryRetrieverScoreComponents,
  MemoryRetrieverSnapshot,
  SerializedMemoryRetrieverRankResult,
  SerializedMemoryRetrieverResult,
  SerializedMemoryRetrieverSnapshot,
} from '@/services/memory/memory-retriever-types';
import {
  MEMORY_RETRIEVER_MAX_CHARACTERS,
  MEMORY_RETRIEVER_MAX_ENTITIES,
  MEMORY_RETRIEVER_MAX_FACTS,
  MEMORY_RETRIEVER_MAX_RELATIONS,
  MEMORY_RETRIEVER_SCORE_MAX,
} from '@/services/memory/memory-retriever-types';

interface RankedItem {
  kind: 'fact' | 'entity' | 'relation';
  score: number;
  characters: number;
  updatedAt: string;
  createdAt: string;
  fact?: MemoryRetrieverRankedFact;
  entity?: MemoryRetrieverRankedEntity;
  relation?: MemoryRetrieverRankedRelation;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function metadataKeywords(metadata: Record<string, unknown>): string[] {
  const keywords: string[] = [];

  for (const value of Object.values(metadata)) {
    if (typeof value === 'string') {
      keywords.push(...tokenize(value));
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      keywords.push(String(value).toLowerCase());
    }
  }

  return keywords;
}

function collectMatchedTokens(searchSpace: string[], queryTokens: string[]): string[] {
  const matched: string[] = [];

  for (const term of queryTokens) {
    for (const segment of searchSpace) {
      const normalized = segment.toLowerCase();
      const segmentTokens = tokenize(segment);

      if (normalized.includes(term) || segmentTokens.includes(term)) {
        matched.push(term);
        break;
      }
    }
  }

  return [...new Set(matched)];
}

function lexicalScore(matchedTokens: string[], queryTokens: string[]): number {
  if (queryTokens.length === 0 || matchedTokens.length === 0) {
    return 0;
  }

  const ratio = matchedTokens.length / queryTokens.length;
  return Math.min(40, Math.round(ratio * 40));
}

function relativeRecencyScore(updatedAt: string, updatedAtValues: string[]): number {
  const unique = [...new Set(updatedAtValues)].sort((left, right) => left.localeCompare(right));

  if (unique.length <= 1) {
    return 10;
  }

  const index = unique.indexOf(updatedAt);
  if (index < 0) {
    return 0;
  }

  return Math.round((index / (unique.length - 1)) * 10);
}

function confidenceScore(confidence: number): number {
  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.min(10, Math.round(Math.max(0, confidence) * 10));
}

function frequencyScore(count: number): number {
  return Math.min(10, Math.max(0, count));
}

function totalScore(components: MemoryRetrieverScoreComponents): number {
  return Math.min(
    MEMORY_RETRIEVER_SCORE_MAX,
    components.lexical +
      components.entityOverlap +
      components.relationOverlap +
      components.recency +
      components.confidence +
      components.frequency,
  );
}

function buildReasons(
  matchedTokens: string[],
  entityReasons: string[],
  relationReasons: string[],
  components: MemoryRetrieverScoreComponents,
): string[] {
  const reasons = [
    ...entityReasons,
    ...relationReasons,
    ...matchedTokens.map((token) => `Matched token "${token}"`),
  ];

  if (components.recency >= 7) {
    reasons.push('Recent fact');
  }

  if (components.confidence >= 8) {
    reasons.push('High confidence');
  }

  return [...new Set(reasons)];
}

function compareRanked<T extends { score: number; updatedAt?: string; createdAt?: string }>(
  left: T & { fact?: MemoryFact; entity?: MemoryEntity; relation?: MemoryRelation },
  right: T & { fact?: MemoryFact; entity?: MemoryEntity; relation?: MemoryRelation },
): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  const leftUpdated =
    left.fact?.updatedAt ??
    left.entity?.updatedAt ??
    left.relation?.updatedAt ??
    left.updatedAt ??
    '';
  const rightUpdated =
    right.fact?.updatedAt ??
    right.entity?.updatedAt ??
    right.relation?.updatedAt ??
    right.updatedAt ??
    '';
  const updatedCompare = rightUpdated.localeCompare(leftUpdated);

  if (updatedCompare !== 0) {
    return updatedCompare;
  }

  const leftCreated =
    left.fact?.createdAt ??
    left.entity?.createdAt ??
    left.relation?.createdAt ??
    left.createdAt ??
    '';
  const rightCreated =
    right.fact?.createdAt ??
    right.entity?.createdAt ??
    right.relation?.createdAt ??
    right.createdAt ??
    '';

  return rightCreated.localeCompare(leftCreated);
}

function entityCharacterCount(entity: MemoryEntity): number {
  return [entity.name, ...entity.aliases].join(' ').length;
}

function relationCharacterCount(
  subjectName: string,
  predicate: string,
  objectName: string,
): number {
  return `${subjectName} ${predicate} ${objectName}`.length;
}

function validateInput(input: MemoryRetrieverInput): MemoryRetrieverInput {
  if (!input || typeof input !== 'object') {
    throw new MemoryRetrieverValidationError('input must be an object');
  }

  if (!isNonEmptyString(input.query)) {
    throw new MemoryRetrieverValidationError('query is required');
  }

  return {
    query: input.query.trim(),
    facts: Array.isArray(input.facts) ? input.facts : [],
    entities: Array.isArray(input.entities) ? input.entities : [],
    relations: Array.isArray(input.relations) ? input.relations : [],
  };
}

/**
 * Deterministic lexical memory retriever for factual long-term memory.
 */
export class MemoryRetriever {
  private lastResult: MemoryRetrieverResult | null = null;
  private lastRank: MemoryRetrieverRankResult | null = null;
  private updatedAt = nowIso();

  constructor(
    private readonly instanceId: string,
    private readonly maxFacts: number,
    private readonly maxEntities: number,
    private readonly maxRelations: number,
    private readonly maxCharacters: number,
  ) {}

  rank(input: MemoryRetrieverInput): MemoryRetrieverRankResult {
    const normalized = validateInput(input);
    const queryTokens = tokenize(normalized.query);

    if (queryTokens.length === 0) {
      const empty: MemoryRetrieverRankResult = {
        query: normalized.query,
        facts: [],
        entities: [],
        relations: [],
      };
      this.lastRank = empty;
      this.updatedAt = nowIso();
      return empty;
    }

    const entityById = new Map(normalized.entities.map((entity) => [entity.id, entity]));
    const factById = new Map(normalized.facts.map((fact) => [fact.id, fact]));
    const allUpdatedAt = [
      ...normalized.facts.map((fact) => fact.updatedAt),
      ...normalized.entities.map((entity) => entity.updatedAt),
      ...normalized.relations.map((relation) => relation.updatedAt),
    ];

    const facts = normalized.facts
      .map((fact) =>
        this.rankFact(fact, queryTokens, entityById, normalized.relations, allUpdatedAt),
      )
      .filter((entry): entry is MemoryRetrieverRankedFact => entry !== null)
      .sort(compareRanked);

    const entities = normalized.entities
      .map((entity) =>
        this.rankEntity(entity, queryTokens, normalized.relations, factById, allUpdatedAt),
      )
      .filter((entry): entry is MemoryRetrieverRankedEntity => entry !== null)
      .sort(compareRanked);

    const relations = normalized.relations
      .map((relation) => this.rankRelation(relation, queryTokens, entityById, allUpdatedAt))
      .filter((entry): entry is MemoryRetrieverRankedRelation => entry !== null)
      .sort(compareRanked);

    const result: MemoryRetrieverRankResult = {
      query: normalized.query,
      facts,
      entities,
      relations,
    };

    this.lastRank = result;
    this.updatedAt = nowIso();
    return result;
  }

  retrieve(input: MemoryRetrieverInput): MemoryRetrieverResult {
    const ranked = this.rank(input);
    const selected = this.selectRankedItems(ranked);
    const aggregateScore = this.computeAggregateScore(selected);
    const reason = this.buildAggregateReason(selected);

    const result: MemoryRetrieverResult = {
      query: ranked.query,
      selectedFacts: selected.facts,
      selectedEntities: selected.entities,
      selectedRelations: selected.relations,
      score: aggregateScore,
      reason,
      truncated: selected.truncated,
      totalCharacters: selected.totalCharacters,
    };

    this.lastResult = result;
    this.updatedAt = nowIso();
    return result;
  }

  explain(result: MemoryRetrieverResult): string[] {
    const lines: string[] = [
      `Query: ${result.query}`,
      `Aggregate score: ${result.score}`,
      `Selected facts: ${result.selectedFacts.length}`,
      `Selected entities: ${result.selectedEntities.length}`,
      `Selected relations: ${result.selectedRelations.length}`,
      `Total characters: ${result.totalCharacters}`,
      `Truncated: ${result.truncated ? 'yes' : 'no'}`,
    ];

    for (const fact of result.selectedFacts) {
      lines.push(
        `Fact ${fact.fact.id} score=${fact.score} tokens=${fact.matchedTokens.join(', ') || 'none'} reasons=${fact.reason.join('; ') || 'none'}`,
      );
    }

    for (const entity of result.selectedEntities) {
      lines.push(
        `Entity ${entity.entity.name} score=${entity.score} tokens=${entity.matchedTokens.join(', ') || 'none'} reasons=${entity.reason.join('; ') || 'none'}`,
      );
    }

    for (const relation of result.selectedRelations) {
      lines.push(
        `Relation ${relation.subjectName} ${relation.relation.predicate} ${relation.objectName} score=${relation.score} tokens=${relation.matchedTokens.join(', ') || 'none'} reasons=${relation.reason.join('; ') || 'none'}`,
      );
    }

    if (result.reason.length > 0) {
      lines.push(`Summary: ${result.reason.join('; ')}`);
    }

    return lines;
  }

  serialize(): SerializedMemoryRetrieverSnapshot {
    return serializeMemoryRetrieverSnapshot({
      snapshot: this.buildSnapshot(),
      lastResult: this.lastResult,
    });
  }

  reset(): void {
    this.lastResult = null;
    this.lastRank = null;
    this.updatedAt = nowIso();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  getLastRank(): MemoryRetrieverRankResult | null {
    return this.lastRank;
  }

  getLastResult(): MemoryRetrieverResult | null {
    return this.lastResult;
  }

  toSerializedRank(result: MemoryRetrieverRankResult): SerializedMemoryRetrieverRankResult {
    return serializeMemoryRetrieverRankResult(result);
  }

  toSerializedResult(result: MemoryRetrieverResult): SerializedMemoryRetrieverResult {
    return serializeMemoryRetrieverResult(result);
  }

  private rankFact(
    fact: MemoryFact,
    queryTokens: string[],
    entityById: Map<string, MemoryEntity>,
    relations: MemoryRelation[],
    allUpdatedAt: string[],
  ): MemoryRetrieverRankedFact | null {
    const searchSpace = [fact.text, fact.type, fact.source, ...metadataKeywords(fact.metadata)];
    const matchedTokens = collectMatchedTokens(searchSpace, queryTokens);
    const entityReasons: string[] = [];
    let entityOverlap = 0;

    for (const entityId of fact.entityIds) {
      const entity = entityById.get(entityId);
      if (!entity) {
        continue;
      }

      for (const name of [entity.name, ...entity.aliases]) {
        for (const token of queryTokens) {
          if (normalizeName(name) === token || name.toLowerCase().includes(token)) {
            entityOverlap = Math.min(20, entityOverlap + 10);
            entityReasons.push(`Matched entity "${entity.name}"`);
          }
        }
      }
    }

    let relationOverlap = 0;
    const relationReasons: string[] = [];
    const linkedRelations = relations.filter(
      (relation) =>
        relation.factIds.includes(fact.id) || fact.entityIds.includes(relation.subjectEntityId),
    );

    for (const relation of linkedRelations) {
      const predicateTokens = tokenize(relation.predicate.replace(/_/g, ' '));
      for (const token of queryTokens) {
        if (relation.predicate.includes(token) || predicateTokens.includes(token)) {
          relationOverlap = Math.min(10, relationOverlap + 5);
          relationReasons.push(`Matched relation "${relation.predicate}"`);
        }
      }

      const subject = entityById.get(relation.subjectEntityId);
      const object = entityById.get(relation.objectEntityId);
      for (const entity of [subject, object]) {
        if (!entity) {
          continue;
        }

        for (const token of queryTokens) {
          if (entity.name.toLowerCase().includes(token)) {
            relationOverlap = Math.min(10, relationOverlap + 3);
          }
        }
      }
    }

    const components: MemoryRetrieverScoreComponents = {
      lexical: lexicalScore(matchedTokens, queryTokens),
      entityOverlap,
      relationOverlap,
      recency: relativeRecencyScore(fact.updatedAt, allUpdatedAt),
      confidence: confidenceScore(fact.confidence),
      frequency: frequencyScore(fact.entityIds.length + linkedRelations.length),
    };

    const score = totalScore(components);
    if (score <= 0) {
      return null;
    }

    return {
      fact,
      score,
      matchedTokens,
      reason: buildReasons(matchedTokens, entityReasons, relationReasons, components),
      components,
    };
  }

  private rankEntity(
    entity: MemoryEntity,
    queryTokens: string[],
    relations: MemoryRelation[],
    factById: Map<string, MemoryFact>,
    allUpdatedAt: string[],
  ): MemoryRetrieverRankedEntity | null {
    const searchSpace = [
      entity.name,
      entity.type,
      ...entity.aliases,
      ...metadataKeywords(entity.metadata),
    ];
    const matchedTokens = collectMatchedTokens(searchSpace, queryTokens);
    const entityReasons: string[] = [];

    for (const name of [entity.name, ...entity.aliases]) {
      for (const token of queryTokens) {
        if (normalizeName(name) === token || name.toLowerCase().includes(token)) {
          entityReasons.push(`Matched entity "${entity.name}"`);
        }
      }
    }

    let relationOverlap = 0;
    const relationReasons: string[] = [];
    const linkedRelations = relations.filter(
      (relation) =>
        relation.subjectEntityId === entity.id ||
        relation.objectEntityId === entity.id ||
        entity.relationIds.includes(relation.id),
    );

    for (const relation of linkedRelations) {
      const predicateTokens = tokenize(relation.predicate.replace(/_/g, ' '));
      for (const token of queryTokens) {
        if (relation.predicate.includes(token) || predicateTokens.includes(token)) {
          relationOverlap = Math.min(10, relationOverlap + 5);
          relationReasons.push(`Matched relation "${relation.predicate}"`);
        }
      }
    }

    const linkedConfidences = entity.factIds
      .map((factId) => factById.get(factId)?.confidence)
      .filter((value): value is number => typeof value === 'number');
    const avgConfidence =
      linkedConfidences.length > 0
        ? linkedConfidences.reduce((sum, value) => sum + value, 0) / linkedConfidences.length
        : 0.5;

    const components: MemoryRetrieverScoreComponents = {
      lexical: lexicalScore(matchedTokens, queryTokens),
      entityOverlap: entityReasons.length > 0 ? Math.min(20, entityReasons.length * 10) : 0,
      relationOverlap,
      recency: relativeRecencyScore(entity.updatedAt, allUpdatedAt),
      confidence: confidenceScore(avgConfidence),
      frequency: frequencyScore(entity.factIds.length + entity.relationIds.length),
    };

    const score = totalScore(components);
    if (score <= 0) {
      return null;
    }

    return {
      entity,
      score,
      matchedTokens,
      reason: buildReasons(matchedTokens, entityReasons, relationReasons, components),
      components,
    };
  }

  private rankRelation(
    relation: MemoryRelation,
    queryTokens: string[],
    entityById: Map<string, MemoryEntity>,
    allUpdatedAt: string[],
  ): MemoryRetrieverRankedRelation | null {
    const subject = entityById.get(relation.subjectEntityId);
    const object = entityById.get(relation.objectEntityId);
    const subjectName = subject?.name ?? relation.subjectEntityId;
    const objectName = object?.name ?? relation.objectEntityId;

    const searchSpace = [
      relation.predicate,
      subjectName,
      objectName,
      ...metadataKeywords(relation.metadata),
    ];
    const matchedTokens = collectMatchedTokens(searchSpace, queryTokens);
    const entityReasons: string[] = [];

    for (const entity of [subject, object]) {
      if (!entity) {
        continue;
      }

      for (const token of queryTokens) {
        if (entity.name.toLowerCase().includes(token)) {
          entityReasons.push(`Matched entity "${entity.name}"`);
        }
      }
    }

    let relationOverlap = 0;
    const relationReasons: string[] = [];
    const predicateTokens = tokenize(relation.predicate.replace(/_/g, ' '));

    for (const token of queryTokens) {
      if (relation.predicate.includes(token) || predicateTokens.includes(token)) {
        relationOverlap = Math.min(10, relationOverlap + 5);
        relationReasons.push(`Matched relation "${relation.predicate}"`);
      }
    }

    const components: MemoryRetrieverScoreComponents = {
      lexical: lexicalScore(matchedTokens, queryTokens),
      entityOverlap: Math.min(20, entityReasons.length * 10),
      relationOverlap,
      recency: relativeRecencyScore(relation.updatedAt, allUpdatedAt),
      confidence: confidenceScore(relation.confidence),
      frequency: frequencyScore(relation.factIds.length),
    };

    const score = totalScore(components);
    if (score <= 0) {
      return null;
    }

    return {
      relation,
      score,
      matchedTokens,
      reason: buildReasons(matchedTokens, entityReasons, relationReasons, components),
      components,
      subjectName,
      objectName,
    };
  }

  private selectRankedItems(ranked: MemoryRetrieverRankResult): {
    facts: MemoryRetrieverRankedFact[];
    entities: MemoryRetrieverRankedEntity[];
    relations: MemoryRetrieverRankedRelation[];
    truncated: boolean;
    totalCharacters: number;
  } {
    const items: RankedItem[] = [
      ...ranked.facts.map((fact) => ({
        kind: 'fact' as const,
        score: fact.score,
        characters: fact.fact.text.length,
        updatedAt: fact.fact.updatedAt,
        createdAt: fact.fact.createdAt,
        fact,
      })),
      ...ranked.entities.map((entity) => ({
        kind: 'entity' as const,
        score: entity.score,
        characters: entityCharacterCount(entity.entity),
        updatedAt: entity.entity.updatedAt,
        createdAt: entity.entity.createdAt,
        entity,
      })),
      ...ranked.relations.map((relation) => ({
        kind: 'relation' as const,
        score: relation.score,
        characters: relationCharacterCount(
          relation.subjectName,
          relation.relation.predicate,
          relation.objectName,
        ),
        updatedAt: relation.relation.updatedAt,
        createdAt: relation.relation.createdAt,
        relation,
      })),
    ].sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const updatedCompare = right.updatedAt.localeCompare(left.updatedAt);
      if (updatedCompare !== 0) {
        return updatedCompare;
      }

      return right.createdAt.localeCompare(left.createdAt);
    });

    const selectedFacts: MemoryRetrieverRankedFact[] = [];
    const selectedEntities: MemoryRetrieverRankedEntity[] = [];
    const selectedRelations: MemoryRetrieverRankedRelation[] = [];
    let totalCharacters = 0;
    let truncated =
      ranked.facts.length > this.maxFacts ||
      ranked.entities.length > this.maxEntities ||
      ranked.relations.length > this.maxRelations;

    for (const item of items) {
      if (item.kind === 'fact' && selectedFacts.length >= this.maxFacts) {
        truncated = true;
        continue;
      }

      if (item.kind === 'entity' && selectedEntities.length >= this.maxEntities) {
        truncated = true;
        continue;
      }

      if (item.kind === 'relation' && selectedRelations.length >= this.maxRelations) {
        truncated = true;
        continue;
      }

      if (totalCharacters + item.characters > this.maxCharacters && totalCharacters > 0) {
        truncated = true;
        break;
      }

      if (item.characters > this.maxCharacters && item.kind === 'fact' && item.fact) {
        selectedFacts.push({
          ...item.fact,
          fact: {
            ...item.fact.fact,
            text: item.fact.fact.text.slice(0, this.maxCharacters),
          },
        });
        totalCharacters = this.maxCharacters;
        truncated = true;
        break;
      }

      if (item.characters > this.maxCharacters) {
        truncated = true;
        break;
      }

      totalCharacters += item.characters;

      if (item.kind === 'fact' && item.fact) {
        selectedFacts.push(item.fact);
      } else if (item.kind === 'entity' && item.entity) {
        selectedEntities.push(item.entity);
      } else if (item.kind === 'relation' && item.relation) {
        selectedRelations.push(item.relation);
      }
    }

    return {
      facts: selectedFacts,
      entities: selectedEntities,
      relations: selectedRelations,
      truncated,
      totalCharacters,
    };
  }

  private computeAggregateScore(selected: {
    facts: MemoryRetrieverRankedFact[];
    entities: MemoryRetrieverRankedEntity[];
    relations: MemoryRetrieverRankedRelation[];
  }): number {
    const scores = [
      ...selected.facts.map((entry) => entry.score),
      ...selected.entities.map((entry) => entry.score),
      ...selected.relations.map((entry) => entry.score),
    ];

    if (scores.length === 0) {
      return 0;
    }

    const total = scores.reduce((sum, score) => sum + score, 0);
    return Math.round(total / scores.length);
  }

  private buildAggregateReason(selected: {
    facts: MemoryRetrieverRankedFact[];
    entities: MemoryRetrieverRankedEntity[];
    relations: MemoryRetrieverRankedRelation[];
  }): string[] {
    const reasons = [
      ...selected.facts.flatMap((entry) => entry.reason),
      ...selected.entities.flatMap((entry) => entry.reason),
      ...selected.relations.flatMap((entry) => entry.reason),
    ];

    return [...new Set(reasons)];
  }

  private buildSnapshot(): MemoryRetrieverSnapshot {
    return {
      instanceId: this.instanceId,
      lastQuery: this.lastResult?.query ?? this.lastRank?.query ?? null,
      lastScore: this.lastResult?.score ?? null,
      lastFactCount: this.lastResult?.selectedFacts.length ?? null,
      lastEntityCount: this.lastResult?.selectedEntities.length ?? null,
      lastRelationCount: this.lastResult?.selectedRelations.length ?? null,
      lastTotalCharacters: this.lastResult?.totalCharacters ?? null,
      lastTruncated: this.lastResult?.truncated ?? null,
      updatedAt: this.updatedAt,
    };
  }
}

export function createMemoryRetriever(options?: MemoryRetrieverOptions): MemoryRetriever {
  const instanceId = options?.instanceId?.trim() || 'default-memory-retriever';

  return new MemoryRetriever(
    instanceId,
    options?.maxFacts ?? MEMORY_RETRIEVER_MAX_FACTS,
    options?.maxEntities ?? MEMORY_RETRIEVER_MAX_ENTITIES,
    options?.maxRelations ?? MEMORY_RETRIEVER_MAX_RELATIONS,
    options?.maxCharacters ?? MEMORY_RETRIEVER_MAX_CHARACTERS,
  );
}

/** Default dev/test singleton. Deterministic memory retriever. */
export const memoryRetriever = createMemoryRetriever();
