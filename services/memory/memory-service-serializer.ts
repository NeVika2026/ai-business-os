import {
  serializeMemoryEntity,
  serializeMemoryFact,
  serializeMemoryRelation,
} from '@/services/memory/memory-engine-serializer';
import { serializeMemoryExtractionResult } from '@/services/memory/memory-extractor-serializer';
import type {
  MemoryProcessResult,
  MemoryPreviewResult,
  MemoryServiceErrorEntry,
  MemoryServiceSnapshot,
  MemoryServiceStatistics,
  SerializedMemoryProcessResult,
  SerializedMemoryPreviewResult,
  SerializedMemoryServiceErrorEntry,
  SerializedMemoryServiceSnapshot,
  SerializedMemoryServiceStatistics,
} from '@/services/memory/memory-service-types';

export function serializeMemoryServiceErrorEntry(
  entry: MemoryServiceErrorEntry,
): SerializedMemoryServiceErrorEntry {
  return {
    stage: entry.stage,
    message: entry.message,
    source: entry.source ?? null,
  };
}

export function serializeMemoryServiceStatistics(
  statistics: MemoryServiceStatistics,
): SerializedMemoryServiceStatistics {
  return {
    factsSaved: statistics.factsSaved,
    entitiesSaved: statistics.entitiesSaved,
    relationsSaved: statistics.relationsSaved,
    duplicatesSkipped: statistics.duplicatesSkipped,
    errors: statistics.errors,
    duration: statistics.duration,
  };
}

export function serializeMemoryProcessResult(
  result: MemoryProcessResult,
): SerializedMemoryProcessResult {
  return {
    input: result.input,
    facts: result.facts.map(serializeMemoryFact),
    entities: result.entities.map(serializeMemoryEntity),
    relations: result.relations.map(serializeMemoryRelation),
    statistics: serializeMemoryServiceStatistics(result.statistics),
    errors: result.errors.map(serializeMemoryServiceErrorEntry),
  };
}

export function serializeMemoryPreviewResult(
  result: MemoryPreviewResult,
): SerializedMemoryPreviewResult {
  return serializeMemoryExtractionResult({
    input: result.input,
    facts: result.facts,
    entities: result.entities,
    relations: result.relations,
    statistics: {
      factCount: result.statistics.factCount,
      entityCount: result.statistics.entityCount,
      relationCount: result.statistics.relationCount,
      duplicatesSkipped: result.statistics.duplicatesSkipped,
      sentencesProcessed: result.statistics.sentencesProcessed,
    },
  });
}

export function serializeMemoryServiceSnapshot(input: {
  snapshot: MemoryServiceSnapshot;
  engine: SerializedMemoryServiceSnapshot['engine'];
  extractor: SerializedMemoryServiceSnapshot['extractor'];
  lastProcess: MemoryProcessResult | null;
}): SerializedMemoryServiceSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    lastOperation: input.snapshot.lastOperation ?? null,
    lastInput: input.snapshot.lastInput ?? null,
    lastProcessedAt: input.snapshot.lastProcessedAt ?? null,
    factCount: input.snapshot.factCount,
    entityCount: input.snapshot.entityCount,
    relationCount: input.snapshot.relationCount,
    updatedAt: input.snapshot.updatedAt,
    engine: input.engine,
    extractor: input.extractor,
    lastProcess: input.lastProcess ? serializeMemoryProcessResult(input.lastProcess) : null,
  };
}
