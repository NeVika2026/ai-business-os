import type {
  ExtractedEntity,
  ExtractedFact,
  ExtractedRelation,
  MemoryExtractionResult,
  MemoryExtractionStatistics,
  MemoryExtractorSnapshot,
  SerializedExtractedEntity,
  SerializedExtractedFact,
  SerializedExtractedRelation,
  SerializedMemoryExtractionResult,
  SerializedMemoryExtractionStatistics,
  SerializedMemoryExtractorSnapshot,
} from '@/services/memory/memory-extractor-types';

function nullifyRecord(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    result[key] = entry === undefined ? null : entry;
  }

  return result;
}

export function serializeExtractedFact(fact: ExtractedFact): SerializedExtractedFact {
  return {
    type: fact.type,
    text: fact.text,
    confidence: fact.confidence,
    confidenceLevel: fact.confidenceLevel,
    pattern: fact.pattern,
    source: fact.source,
    metadata: nullifyRecord(fact.metadata),
  };
}

export function serializeExtractedEntity(entity: ExtractedEntity): SerializedExtractedEntity {
  return {
    name: entity.name,
    type: entity.type,
    aliases: [...entity.aliases],
    confidence: entity.confidence,
    source: entity.source,
    metadata: nullifyRecord(entity.metadata),
  };
}

export function serializeExtractedRelation(
  relation: ExtractedRelation,
): SerializedExtractedRelation {
  return {
    subject: relation.subject,
    predicate: relation.predicate,
    object: relation.object,
    confidence: relation.confidence,
    confidenceLevel: relation.confidenceLevel,
    pattern: relation.pattern,
    source: relation.source,
    metadata: nullifyRecord(relation.metadata),
  };
}

export function serializeMemoryExtractionStatistics(
  statistics: MemoryExtractionStatistics,
): SerializedMemoryExtractionStatistics {
  return {
    factCount: statistics.factCount,
    entityCount: statistics.entityCount,
    relationCount: statistics.relationCount,
    duplicatesSkipped: statistics.duplicatesSkipped,
    sentencesProcessed: statistics.sentencesProcessed,
  };
}

export function serializeMemoryExtractionResult(
  result: MemoryExtractionResult,
): SerializedMemoryExtractionResult {
  return {
    input: result.input,
    facts: result.facts.map(serializeExtractedFact),
    entities: result.entities.map(serializeExtractedEntity),
    relations: result.relations.map(serializeExtractedRelation),
    statistics: serializeMemoryExtractionStatistics(result.statistics),
  };
}

export function serializeMemoryExtractorSnapshot(input: {
  snapshot: MemoryExtractorSnapshot;
  lastResult: MemoryExtractionResult | null;
}): SerializedMemoryExtractorSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    lastInput: input.snapshot.lastInput ?? null,
    lastExtractedAt: input.snapshot.lastExtractedAt ?? null,
    extractionCount: input.snapshot.extractionCount,
    statistics: serializeMemoryExtractionStatistics(input.snapshot.statistics),
    updatedAt: input.snapshot.updatedAt,
    lastResult: input.lastResult ? serializeMemoryExtractionResult(input.lastResult) : null,
  };
}
