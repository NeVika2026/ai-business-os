import {
  serializeMemoryEntity,
  serializeMemoryFact,
  serializeMemoryRelation,
} from '@/services/memory/memory-engine-serializer';
import { serializeMemoryPreviewResult } from '@/services/memory/memory-service-serializer';
import type {
  RuntimeMemoryServiceContextEntity,
  RuntimeMemoryServiceContextFact,
  RuntimeMemoryServiceContextRelation,
  RuntimeMemoryServiceContextResult,
  RuntimeMemoryServiceSnapshot,
  SerializedRuntimeMemoryServiceContextEntity,
  SerializedRuntimeMemoryServiceContextFact,
  SerializedRuntimeMemoryServiceContextRelation,
  SerializedRuntimeMemoryServiceContextResult,
  SerializedRuntimeMemoryServiceSnapshot,
} from '@/services/runtime/runtime-memory-service-types';

function nullifyRecord(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    result[key] = entry === undefined ? null : entry;
  }

  return result;
}

export function serializeRuntimeMemoryServiceContextFact(
  fact: RuntimeMemoryServiceContextFact,
): SerializedRuntimeMemoryServiceContextFact {
  return {
    factId: fact.factId,
    type: fact.type,
    text: fact.text,
    confidence: fact.confidence,
    score: fact.score,
    source: fact.source,
  };
}

export function serializeRuntimeMemoryServiceContextEntity(
  entity: RuntimeMemoryServiceContextEntity,
): SerializedRuntimeMemoryServiceContextEntity {
  return {
    entityId: entity.entityId,
    name: entity.name,
    type: entity.type,
    aliases: [...entity.aliases],
    score: entity.score,
  };
}

export function serializeRuntimeMemoryServiceContextRelation(
  relation: RuntimeMemoryServiceContextRelation,
): SerializedRuntimeMemoryServiceContextRelation {
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

export function serializeRuntimeMemoryServiceContextResult(
  result: RuntimeMemoryServiceContextResult,
): SerializedRuntimeMemoryServiceContextResult {
  return {
    query: result.query,
    factCount: result.factCount,
    entityCount: result.entityCount,
    relationCount: result.relationCount,
    totalCharacters: result.totalCharacters,
    truncated: result.truncated,
    memoryFailed: result.memoryFailed,
    failureMessage: result.failureMessage ?? null,
    facts: result.facts.map(serializeRuntimeMemoryServiceContextFact),
    entities: result.entities.map(serializeRuntimeMemoryServiceContextEntity),
    relations: result.relations.map(serializeRuntimeMemoryServiceContextRelation),
  };
}

export function createEmptyRuntimeMemoryServiceContextResult(
  query: string,
  failureMessage: string | null = null,
): RuntimeMemoryServiceContextResult {
  return {
    query,
    factCount: 0,
    entityCount: 0,
    relationCount: 0,
    totalCharacters: 0,
    truncated: false,
    memoryFailed: Boolean(failureMessage),
    failureMessage,
    facts: [],
    entities: [],
    relations: [],
  };
}

export function serializeRuntimeMemoryServiceSnapshot(input: {
  snapshot: RuntimeMemoryServiceSnapshot;
  service: SerializedRuntimeMemoryServiceSnapshot['service'];
}): SerializedRuntimeMemoryServiceSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    lastOperation: input.snapshot.lastOperation ?? null,
    lastQuery: input.snapshot.lastQuery ?? null,
    lastInput: input.snapshot.lastInput ?? null,
    lastFailureMessage: input.snapshot.lastFailureMessage ?? null,
    factCount: input.snapshot.factCount,
    entityCount: input.snapshot.entityCount,
    relationCount: input.snapshot.relationCount,
    updatedAt: input.snapshot.updatedAt,
    service: input.service,
  };
}

export function serializeRuntimeMemoryServiceProcessResult(
  result: import('@/services/runtime/runtime-memory-service-types').RuntimeMemoryServiceProcessResult,
) {
  return {
    input: result.input,
    memoryFailed: result.memoryFailed,
    failureMessage: result.failureMessage ?? null,
    facts: result.facts.map(serializeMemoryFact),
    entities: result.entities.map(serializeMemoryEntity),
    relations: result.relations.map(serializeMemoryRelation),
    statistics: {
      factsSaved: result.statistics.factsSaved,
      entitiesSaved: result.statistics.entitiesSaved,
      relationsSaved: result.statistics.relationsSaved,
      duplicatesSkipped: result.statistics.duplicatesSkipped,
      errors: result.statistics.errors,
      duration: result.statistics.duration,
    },
    errors: result.errors.map((entry) => ({
      stage: entry.stage,
      message: entry.message,
      source: entry.source ?? null,
    })),
  };
}

export function serializeRuntimeMemoryServicePreviewResult(
  result: import('@/services/memory/memory-service-types').MemoryPreviewResult,
) {
  return serializeMemoryPreviewResult(result);
}

export function serializeRuntimeMemoryServiceSearchResult(
  result: import('@/services/memory/memory-engine-types').MemorySearchResult,
) {
  return {
    facts: result.facts.map((entry) => ({
      fact: serializeMemoryFact(entry.fact),
      score: entry.score,
      reason: entry.reason.map((item) => ({
        field: item.field,
        value: item.value,
      })),
    })),
    entities: result.entities.map((entry) => ({
      entity: serializeMemoryEntity(entry.entity),
      score: entry.score,
      reason: entry.reason.map((item) => ({
        field: item.field,
        value: item.value,
      })),
    })),
    relations: result.relations.map((entry) => ({
      relation: serializeMemoryRelation(entry.relation),
      score: entry.score,
      reason: entry.reason.map((item) => ({
        field: item.field,
        value: item.value,
      })),
    })),
  };
}

export function serializeRuntimeMemoryServiceRememberResult(
  result: import('@/services/memory/memory-engine-types').MemoryFact | null,
  memoryFailed: boolean,
  failureMessage: string | null,
) {
  return {
    fact: result ? serializeMemoryFact(result) : null,
    memoryFailed,
    failureMessage,
    metadata: nullifyRecord({}),
  };
}
