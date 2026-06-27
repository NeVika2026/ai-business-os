import { MemoryServiceValidationError } from '@/services/memory/memory-service-errors';
import { serializeMemoryServiceSnapshot } from '@/services/memory/memory-service-serializer';
import { createMemoryEngine, type MemoryEngine } from '@/services/memory/memory-engine';
import type {
  MemoryEntity,
  MemoryEntityFilter,
  MemoryFact,
  MemoryFactFilter,
  MemoryRelation,
  MemoryRelationFilter,
  MemorySearchResult,
  RememberEntityInput,
  RememberInput,
  RememberRelationInput,
} from '@/services/memory/memory-engine-types';
import { createMemoryExtractor, type MemoryExtractor } from '@/services/memory/memory-extractor';
import type {
  ExtractedEntity,
  ExtractedFact,
  MemoryExtractionResult,
  MemoryExtractorInput,
} from '@/services/memory/memory-extractor-types';
import type {
  MemoryPreviewResult,
  MemoryProcessResult,
  MemoryServiceErrorEntry,
  MemoryServiceInput,
  MemoryServiceOptions,
  MemoryServiceSnapshot,
  MemoryServiceStatistics,
  SerializedMemoryServiceSnapshot,
} from '@/services/memory/memory-service-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createEmptyStatistics(): MemoryServiceStatistics {
  return {
    factsSaved: 0,
    entitiesSaved: 0,
    relationsSaved: 0,
    duplicatesSkipped: 0,
    errors: 0,
    duration: 0,
  };
}

function toExtractorInput(input: MemoryServiceInput): MemoryExtractorInput {
  return {
    text: input.text,
    source: input.source,
    metadata: input.metadata,
  };
}

function toRememberEntity(entity: ExtractedEntity): RememberEntityInput {
  return {
    name: entity.name,
    type: entity.type,
    aliases: [...entity.aliases],
    metadata: { ...entity.metadata },
  };
}

function toRememberRelation(
  relation: MemoryExtractionResult['relations'][number],
): RememberRelationInput {
  return {
    subject: relation.subject,
    predicate: relation.predicate,
    object: relation.object,
    confidence: relation.confidence,
    metadata: {
      ...relation.metadata,
      extractorPattern: relation.pattern,
      confidenceLevel: relation.confidenceLevel,
    },
  };
}

/**
 * Orchestrates rule-based extraction and deterministic memory persistence.
 */
export class MemoryService {
  private lastOperation: MemoryServiceSnapshot['lastOperation'] = null;
  private lastInput: string | null = null;
  private lastProcessedAt: string | null = null;
  private lastProcess: MemoryProcessResult | null = null;
  private updatedAt = nowIso();

  constructor(
    private readonly instanceId: string,
    private readonly engine: MemoryEngine,
    private readonly extractor: MemoryExtractor,
  ) {}

  process(input: MemoryServiceInput): MemoryProcessResult {
    const normalized = this.validateServiceInput(input);
    const startedAt = Date.now();
    const errors: MemoryServiceErrorEntry[] = [];

    let extraction: MemoryExtractionResult;
    try {
      extraction = this.extractor.preview(toExtractorInput(normalized));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'memory extraction failed';
      errors.push({
        stage: 'extract',
        message,
        source: normalized.source ?? null,
      });

      const result = this.buildProcessResult(
        normalized.text,
        [],
        [],
        [],
        {
          ...createEmptyStatistics(),
          errors: errors.length,
          duration: Date.now() - startedAt,
        },
        errors,
      );

      this.touch('process', normalized.text, result);
      return result;
    }

    const entityInputs = extraction.entities.map(toRememberEntity);
    const relationInputs = extraction.relations.map(toRememberRelation);
    const factsToPersist = this.resolveFactsToPersist(extraction);
    const savedFacts: MemoryFact[] = [];
    const savedFactIds = new Set<string>();
    let duplicatesSkipped = extraction.statistics.duplicatesSkipped;

    for (let index = 0; index < factsToPersist.length; index += 1) {
      const fact = factsToPersist[index];

      try {
        const remembered = this.engine.remember({
          type: fact.type,
          text: fact.text,
          confidence: fact.confidence,
          source: fact.source || normalized.source,
          metadata: {
            ...fact.metadata,
            extractorPattern: fact.pattern,
            confidenceLevel: fact.confidenceLevel,
          },
          entities: index === 0 ? entityInputs : undefined,
          relations: index === 0 ? relationInputs : undefined,
        });

        if (savedFactIds.has(remembered.id)) {
          duplicatesSkipped += 1;
        } else {
          savedFacts.push(remembered);
        }

        savedFactIds.add(remembered.id);
      } catch (error) {
        errors.push({
          stage: 'remember',
          message: error instanceof Error ? error.message : 'memory remember failed',
          source: fact.source || normalized.source || null,
        });
      }
    }

    if (factsToPersist.length === 0 && (entityInputs.length > 0 || relationInputs.length > 0)) {
      try {
        const remembered = this.engine.remember({
          type: 'event',
          text: normalized.text,
          confidence: 0.7,
          source: normalized.source,
          metadata: {
            ...(normalized.metadata ?? {}),
            bootstrap: true,
          },
          entities: entityInputs,
          relations: relationInputs,
        });

        if (!savedFactIds.has(remembered.id)) {
          savedFacts.push(remembered);
        }

        savedFactIds.add(remembered.id);
      } catch (error) {
        errors.push({
          stage: 'remember',
          message: error instanceof Error ? error.message : 'memory bootstrap remember failed',
          source: normalized.source ?? null,
        });
      }
    }

    const savedEntities = this.resolveSavedEntities(extraction.entities);
    const savedRelations = this.resolveSavedRelations(extraction.relations);

    const result = this.buildProcessResult(
      normalized.text,
      savedFacts,
      savedEntities,
      savedRelations,
      {
        factsSaved: savedFacts.length,
        entitiesSaved: savedEntities.length,
        relationsSaved: savedRelations.length,
        duplicatesSkipped,
        errors: errors.length,
        duration: Date.now() - startedAt,
      },
      errors,
    );

    this.touch('process', normalized.text, result);
    return result;
  }

  preview(input: MemoryServiceInput): MemoryPreviewResult {
    const normalized = this.validateServiceInput(input);
    const extraction = this.extractor.preview(toExtractorInput(normalized));

    this.touch('preview', normalized.text, null);

    return {
      input: extraction.input,
      facts: extraction.facts,
      entities: extraction.entities,
      relations: extraction.relations,
      statistics: {
        factCount: extraction.statistics.factCount,
        entityCount: extraction.statistics.entityCount,
        relationCount: extraction.statistics.relationCount,
        duplicatesSkipped: extraction.statistics.duplicatesSkipped,
        sentencesProcessed: extraction.statistics.sentencesProcessed,
      },
    };
  }

  remember(input: RememberInput): MemoryFact {
    const remembered = this.engine.remember(input);
    this.touch('remember', input.text, null);
    return remembered;
  }

  search(query: string): MemorySearchResult {
    return this.engine.search(query);
  }

  facts(filter?: MemoryFactFilter): MemoryFact[] {
    return this.engine.facts(filter);
  }

  entities(filter?: MemoryEntityFilter): MemoryEntity[] {
    return this.engine.entities(filter);
  }

  relations(filter?: MemoryRelationFilter): MemoryRelation[] {
    return this.engine.relations(filter);
  }

  snapshot(): MemoryServiceSnapshot {
    return this.buildSnapshot();
  }

  serialize(): SerializedMemoryServiceSnapshot {
    return serializeMemoryServiceSnapshot({
      snapshot: this.buildSnapshot(),
      engine: this.engine.serialize(),
      extractor: this.extractor.serialize(),
      lastProcess: this.lastProcess,
    });
  }

  reset(): void {
    this.engine.reset();
    this.extractor.reset();
    this.lastOperation = null;
    this.lastInput = null;
    this.lastProcessedAt = null;
    this.lastProcess = null;
    this.updatedAt = nowIso();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private validateServiceInput(input: MemoryServiceInput): MemoryServiceInput {
    if (!input || typeof input !== 'object') {
      throw new MemoryServiceValidationError('input must be an object');
    }

    if (!isNonEmptyString(input.text)) {
      throw new MemoryServiceValidationError('input text is required');
    }

    return {
      text: input.text.trim(),
      source: input.source?.trim() || 'memory-service',
      metadata: { ...(input.metadata ?? {}) },
    };
  }

  private resolveFactsToPersist(extraction: MemoryExtractionResult): ExtractedFact[] {
    if (extraction.facts.length > 0) {
      return extraction.facts;
    }

    return [];
  }

  private resolveSavedEntities(extracted: MemoryExtractionResult['entities']): MemoryEntity[] {
    const resolved: MemoryEntity[] = [];
    const seen = new Set<string>();

    for (const entity of extracted) {
      const match =
        this.engine.entities({ name: entity.name })[0] ??
        entity.aliases
          .map((alias) => this.engine.entities({ alias })[0])
          .find((entry) => entry !== undefined);

      if (!match || seen.has(match.id)) {
        continue;
      }

      seen.add(match.id);
      resolved.push(match);
    }

    return resolved.sort((left, right) => left.name.localeCompare(right.name));
  }

  private resolveSavedRelations(extracted: MemoryExtractionResult['relations']): MemoryRelation[] {
    const resolved: MemoryRelation[] = [];
    const seen = new Set<string>();

    for (const relation of extracted) {
      const subject =
        this.engine.entities({ name: relation.subject })[0] ??
        this.engine.entities({ alias: relation.subject })[0];
      const object =
        this.engine.entities({ name: relation.object })[0] ??
        this.engine.entities({ alias: relation.object })[0];

      if (!subject || !object) {
        continue;
      }

      const match = this.engine.relations({
        subjectEntityId: subject.id,
        objectEntityId: object.id,
        predicate: relation.predicate,
      })[0];

      if (!match || seen.has(match.id)) {
        continue;
      }

      seen.add(match.id);
      resolved.push(match);
    }

    return resolved.sort((left, right) =>
      `${left.predicate}:${left.subjectEntityId}:${left.objectEntityId}`.localeCompare(
        `${right.predicate}:${right.subjectEntityId}:${right.objectEntityId}`,
      ),
    );
  }

  private buildProcessResult(
    input: string,
    facts: MemoryFact[],
    entities: MemoryEntity[],
    relations: MemoryRelation[],
    statistics: MemoryServiceStatistics,
    errors: MemoryServiceErrorEntry[],
  ): MemoryProcessResult {
    return {
      input,
      facts,
      entities,
      relations,
      statistics,
      errors,
    };
  }

  private buildSnapshot(): MemoryServiceSnapshot {
    const engineSnapshot = this.engine.snapshot();

    return {
      instanceId: this.instanceId,
      lastOperation: this.lastOperation,
      lastInput: this.lastInput,
      lastProcessedAt: this.lastProcessedAt,
      factCount: engineSnapshot.factCount,
      entityCount: engineSnapshot.entityCount,
      relationCount: engineSnapshot.relationCount,
      updatedAt: this.updatedAt,
    };
  }

  private touch(
    operation: MemoryServiceSnapshot['lastOperation'],
    input: string,
    result: MemoryProcessResult | null,
  ): void {
    this.lastOperation = operation;
    this.lastInput = input;
    this.lastProcessedAt = nowIso();
    this.lastProcess = result;
    this.updatedAt = this.lastProcessedAt;
  }
}

export function createMemoryService(options?: MemoryServiceOptions): MemoryService {
  const instanceId = options?.instanceId?.trim() || 'default-memory-service';
  const engine = options?.engine ?? createMemoryEngine({ instanceId: `${instanceId}-engine` });
  const extractor =
    options?.extractor ?? createMemoryExtractor({ instanceId: `${instanceId}-extractor` });

  return new MemoryService(instanceId, engine, extractor);
}

/** Default dev/test singleton. Extractor + engine orchestrator. */
export const memoryService = createMemoryService();
