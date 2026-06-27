import type {
  MemoryEngineSnapshot,
  MemoryEntity,
  MemoryFact,
  MemoryRelation,
  MemorySearchEntityResult,
  MemorySearchFactResult,
  MemorySearchRelationResult,
  MemorySearchResult,
  SerializedMemoryEngineSnapshot,
  SerializedMemoryEntity,
  SerializedMemoryFact,
  SerializedMemoryRelation,
  SerializedMemorySearchEntityResult,
  SerializedMemorySearchFactResult,
  SerializedMemorySearchMatchReason,
  SerializedMemorySearchRelationResult,
  SerializedMemorySearchResult,
} from '@/services/memory/memory-engine-types';

function nullifyRecord(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    result[key] = entry === undefined ? null : entry;
  }

  return result;
}

export function serializeMemoryFact(fact: MemoryFact): SerializedMemoryFact {
  return {
    id: fact.id,
    type: fact.type,
    text: fact.text,
    entityIds: [...fact.entityIds],
    confidence: fact.confidence,
    source: fact.source,
    createdAt: fact.createdAt,
    updatedAt: fact.updatedAt,
    metadata: nullifyRecord(fact.metadata),
  };
}

export function serializeMemoryEntity(entity: MemoryEntity): SerializedMemoryEntity {
  return {
    id: entity.id,
    name: entity.name,
    type: entity.type,
    aliases: [...entity.aliases],
    factIds: [...entity.factIds],
    relationIds: [...entity.relationIds],
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    metadata: nullifyRecord(entity.metadata),
  };
}

export function serializeMemoryRelation(relation: MemoryRelation): SerializedMemoryRelation {
  return {
    id: relation.id,
    subjectEntityId: relation.subjectEntityId,
    predicate: relation.predicate,
    objectEntityId: relation.objectEntityId,
    factIds: [...relation.factIds],
    confidence: relation.confidence,
    createdAt: relation.createdAt,
    updatedAt: relation.updatedAt,
    metadata: nullifyRecord(relation.metadata),
  };
}

function serializeSearchReason(
  reason: SerializedMemorySearchMatchReason,
): SerializedMemorySearchMatchReason {
  return {
    field: reason.field,
    value: reason.value,
  };
}

export function serializeMemorySearchFactResult(
  result: MemorySearchFactResult,
): SerializedMemorySearchFactResult {
  return {
    fact: serializeMemoryFact(result.fact),
    score: result.score,
    reason: result.reason.map(serializeSearchReason),
  };
}

export function serializeMemorySearchEntityResult(
  result: MemorySearchEntityResult,
): SerializedMemorySearchEntityResult {
  return {
    entity: serializeMemoryEntity(result.entity),
    score: result.score,
    reason: result.reason.map(serializeSearchReason),
  };
}

export function serializeMemorySearchRelationResult(
  result: MemorySearchRelationResult,
): SerializedMemorySearchRelationResult {
  return {
    relation: serializeMemoryRelation(result.relation),
    score: result.score,
    reason: result.reason.map(serializeSearchReason),
  };
}

export function serializeMemorySearchResult(
  result: MemorySearchResult,
): SerializedMemorySearchResult {
  return {
    facts: result.facts.map(serializeMemorySearchFactResult),
    entities: result.entities.map(serializeMemorySearchEntityResult),
    relations: result.relations.map(serializeMemorySearchRelationResult),
  };
}

export function serializeMemoryEngineSnapshot(input: {
  snapshot: MemoryEngineSnapshot;
  facts: MemoryFact[];
  entities: MemoryEntity[];
  relations: MemoryRelation[];
}): SerializedMemoryEngineSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    factCount: input.snapshot.factCount,
    entityCount: input.snapshot.entityCount,
    relationCount: input.snapshot.relationCount,
    updatedAt: input.snapshot.updatedAt,
    facts: input.facts.map(serializeMemoryFact),
    entities: input.entities.map(serializeMemoryEntity),
    relations: input.relations.map(serializeMemoryRelation),
  };
}
