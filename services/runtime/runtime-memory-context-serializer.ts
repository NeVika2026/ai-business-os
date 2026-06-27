import type {
  RuntimeMemoryContextBuildResult,
  RuntimeMemoryContextSnapshot,
  RuntimeMemoryInjectedEntity,
  RuntimeMemoryInjectedFact,
  RuntimeMemoryInjectedRelation,
  SerializedRuntimeMemoryContextBuildResult,
  SerializedRuntimeMemoryContextSnapshot,
  SerializedRuntimeMemoryInjectedEntity,
  SerializedRuntimeMemoryInjectedFact,
  SerializedRuntimeMemoryInjectedRelation,
} from '@/services/runtime/runtime-memory-context-types';

export function serializeRuntimeMemoryInjectedFact(
  fact: RuntimeMemoryInjectedFact,
): SerializedRuntimeMemoryInjectedFact {
  return {
    factId: fact.factId,
    type: fact.type,
    text: fact.text,
    confidence: fact.confidence,
    score: fact.score,
    source: fact.source,
  };
}

export function serializeRuntimeMemoryInjectedEntity(
  entity: RuntimeMemoryInjectedEntity,
): SerializedRuntimeMemoryInjectedEntity {
  return {
    entityId: entity.entityId,
    name: entity.name,
    type: entity.type,
    aliases: [...entity.aliases],
    score: entity.score,
  };
}

export function serializeRuntimeMemoryInjectedRelation(
  relation: RuntimeMemoryInjectedRelation,
): SerializedRuntimeMemoryInjectedRelation {
  return {
    relationId: relation.relationId,
    subjectEntityId: relation.subjectEntityId,
    subjectName: relation.subjectName,
    predicate: relation.predicate,
    objectEntityId: relation.objectEntityId,
    objectName: relation.objectName,
    score: relation.score,
  };
}

export function serializeRuntimeMemoryContextBuildResult(
  result: RuntimeMemoryContextBuildResult,
): SerializedRuntimeMemoryContextBuildResult {
  return {
    enabled: result.enabled,
    query: result.query,
    factCount: result.factCount,
    entityCount: result.entityCount,
    relationCount: result.relationCount,
    totalCharacters: result.totalCharacters,
    truncated: result.truncated,
    memoryFailed: result.memoryFailed,
    failureMessage: result.failureMessage ?? null,
    facts: result.facts.map(serializeRuntimeMemoryInjectedFact),
    entities: result.entities.map(serializeRuntimeMemoryInjectedEntity),
    relations: result.relations.map(serializeRuntimeMemoryInjectedRelation),
  };
}

export function serializeRuntimeMemoryContextSnapshot(input: {
  instanceId: string;
  snapshot: RuntimeMemoryContextSnapshot;
}): SerializedRuntimeMemoryContextSnapshot {
  return {
    instanceId: input.instanceId,
    lastQuery: input.snapshot.lastQuery ?? null,
    lastFactCount: input.snapshot.lastFactCount ?? null,
    lastEntityCount: input.snapshot.lastEntityCount ?? null,
    lastRelationCount: input.snapshot.lastRelationCount ?? null,
    lastTotalCharacters: input.snapshot.lastTotalCharacters ?? null,
    lastMemoryFailed: input.snapshot.lastMemoryFailed ?? null,
    lastFailureMessage: input.snapshot.lastFailureMessage ?? null,
    enabled: input.snapshot.enabled,
    updatedAt: input.snapshot.updatedAt,
  };
}

export function createEmptyRuntimeMemoryContextBuildResult(
  query: string,
  enabled: boolean,
): RuntimeMemoryContextBuildResult {
  return {
    enabled,
    query,
    factCount: 0,
    entityCount: 0,
    relationCount: 0,
    totalCharacters: 0,
    truncated: false,
    memoryFailed: false,
    failureMessage: null,
    facts: [],
    entities: [],
    relations: [],
  };
}
