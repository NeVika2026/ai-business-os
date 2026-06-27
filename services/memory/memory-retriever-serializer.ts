import type {
  MemoryRetrieverRankResult,
  MemoryRetrieverRankedEntity,
  MemoryRetrieverRankedFact,
  MemoryRetrieverRankedRelation,
  MemoryRetrieverResult,
  MemoryRetrieverScoreComponents,
  MemoryRetrieverSnapshot,
  SerializedMemoryRetrieverRankResult,
  SerializedMemoryRetrieverRankedEntity,
  SerializedMemoryRetrieverRankedFact,
  SerializedMemoryRetrieverRankedRelation,
  SerializedMemoryRetrieverResult,
  SerializedMemoryRetrieverScoreComponents,
  SerializedMemoryRetrieverSnapshot,
} from '@/services/memory/memory-retriever-types';

function serializeComponents(
  components: MemoryRetrieverScoreComponents,
): SerializedMemoryRetrieverScoreComponents {
  return {
    lexical: components.lexical,
    entityOverlap: components.entityOverlap,
    relationOverlap: components.relationOverlap,
    recency: components.recency,
    confidence: components.confidence,
    frequency: components.frequency,
  };
}

export function serializeMemoryRetrieverRankedFact(
  entry: MemoryRetrieverRankedFact,
): SerializedMemoryRetrieverRankedFact {
  return {
    factId: entry.fact.id,
    type: entry.fact.type,
    text: entry.fact.text,
    confidence: entry.fact.confidence,
    score: entry.score,
    matchedTokens: [...entry.matchedTokens],
    reason: [...entry.reason],
    components: serializeComponents(entry.components),
  };
}

export function serializeMemoryRetrieverRankedEntity(
  entry: MemoryRetrieverRankedEntity,
): SerializedMemoryRetrieverRankedEntity {
  return {
    entityId: entry.entity.id,
    name: entry.entity.name,
    type: entry.entity.type,
    aliases: [...entry.entity.aliases],
    score: entry.score,
    matchedTokens: [...entry.matchedTokens],
    reason: [...entry.reason],
    components: serializeComponents(entry.components),
  };
}

export function serializeMemoryRetrieverRankedRelation(
  entry: MemoryRetrieverRankedRelation,
): SerializedMemoryRetrieverRankedRelation {
  return {
    relationId: entry.relation.id,
    subjectEntityId: entry.relation.subjectEntityId,
    subjectName: entry.subjectName,
    predicate: entry.relation.predicate,
    objectEntityId: entry.relation.objectEntityId,
    objectName: entry.objectName,
    score: entry.score,
    matchedTokens: [...entry.matchedTokens],
    reason: [...entry.reason],
    components: serializeComponents(entry.components),
  };
}

export function serializeMemoryRetrieverRankResult(
  result: MemoryRetrieverRankResult,
): SerializedMemoryRetrieverRankResult {
  return {
    query: result.query,
    facts: result.facts.map(serializeMemoryRetrieverRankedFact),
    entities: result.entities.map(serializeMemoryRetrieverRankedEntity),
    relations: result.relations.map(serializeMemoryRetrieverRankedRelation),
  };
}

export function serializeMemoryRetrieverResult(
  result: MemoryRetrieverResult,
): SerializedMemoryRetrieverResult {
  return {
    query: result.query,
    selectedFacts: result.selectedFacts.map(serializeMemoryRetrieverRankedFact),
    selectedEntities: result.selectedEntities.map(serializeMemoryRetrieverRankedEntity),
    selectedRelations: result.selectedRelations.map(serializeMemoryRetrieverRankedRelation),
    score: result.score,
    reason: [...result.reason],
    truncated: result.truncated,
    totalCharacters: result.totalCharacters,
  };
}

export function serializeMemoryRetrieverSnapshot(input: {
  snapshot: MemoryRetrieverSnapshot;
  lastResult: MemoryRetrieverResult | null;
}): SerializedMemoryRetrieverSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    lastQuery: input.snapshot.lastQuery ?? null,
    lastScore: input.snapshot.lastScore ?? null,
    lastFactCount: input.snapshot.lastFactCount ?? null,
    lastEntityCount: input.snapshot.lastEntityCount ?? null,
    lastRelationCount: input.snapshot.lastRelationCount ?? null,
    lastTotalCharacters: input.snapshot.lastTotalCharacters ?? null,
    lastTruncated: input.snapshot.lastTruncated ?? null,
    updatedAt: input.snapshot.updatedAt,
    lastResult: input.lastResult ? serializeMemoryRetrieverResult(input.lastResult) : null,
  };
}
