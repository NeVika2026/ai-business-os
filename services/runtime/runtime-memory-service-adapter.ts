import { createMemoryService, type MemoryService } from '@/services/memory/memory-service';
import type {
  MemoryEntityFilter,
  MemoryFactFilter,
  MemoryRelationFilter,
  RememberInput,
} from '@/services/memory/memory-engine-types';
import { RuntimeMemoryServiceValidationError } from '@/services/runtime/runtime-memory-service-errors';
import {
  createEmptyRuntimeMemoryServiceContextResult,
  serializeRuntimeMemoryServiceContextResult,
  serializeRuntimeMemoryServicePreviewResult,
  serializeRuntimeMemoryServiceProcessResult,
  serializeRuntimeMemoryServiceRememberResult,
  serializeRuntimeMemoryServiceSearchResult,
  serializeRuntimeMemoryServiceSnapshot,
} from '@/services/runtime/runtime-memory-service-serializer';
import type {
  RuntimeMemoryServiceAdapterOptions,
  RuntimeMemoryServiceContextEntity,
  RuntimeMemoryServiceContextFact,
  RuntimeMemoryServiceContextRelation,
  RuntimeMemoryServiceContextResult,
  RuntimeMemoryServiceInput,
  RuntimeMemoryServiceOperation,
  RuntimeMemoryServiceProcessResult,
  RuntimeMemoryServiceRememberInput,
  RuntimeMemoryServiceSnapshot,
  SerializedRuntimeMemoryServiceContextResult,
  SerializedRuntimeMemoryServiceSnapshot,
} from '@/services/runtime/runtime-memory-service-types';
import {
  RUNTIME_MEMORY_SERVICE_CONTEXT_MAX_CHARACTERS,
  RUNTIME_MEMORY_SERVICE_CONTEXT_MAX_ENTITIES,
  RUNTIME_MEMORY_SERVICE_CONTEXT_MAX_FACTS,
  RUNTIME_MEMORY_SERVICE_CONTEXT_MAX_RELATIONS,
} from '@/services/runtime/runtime-memory-service-types';

interface ScoredContextItem {
  kind: 'fact' | 'entity' | 'relation';
  score: number;
  characters: number;
  fact?: RuntimeMemoryServiceContextFact;
  entity?: RuntimeMemoryServiceContextEntity;
  relation?: RuntimeMemoryServiceContextRelation;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function validateInput(input: RuntimeMemoryServiceInput): RuntimeMemoryServiceInput {
  if (!input || typeof input !== 'object') {
    throw new RuntimeMemoryServiceValidationError('input must be an object');
  }

  if (!isNonEmptyString(input.text)) {
    throw new RuntimeMemoryServiceValidationError('input text is required');
  }

  return {
    text: input.text.trim(),
    source: input.source?.trim() || 'runtime-memory-service-adapter',
    metadata: { ...(input.metadata ?? {}) },
  };
}

function validateRememberInput(input: RuntimeMemoryServiceRememberInput): RememberInput {
  if (!input || typeof input !== 'object') {
    throw new RuntimeMemoryServiceValidationError('remember input must be an object');
  }

  if (!isNonEmptyString(input.text)) {
    throw new RuntimeMemoryServiceValidationError('remember text is required');
  }

  return {
    type: input.type,
    text: input.text.trim(),
    confidence: input.confidence,
    source: input.source?.trim() || 'runtime-memory-service-adapter',
    metadata: { ...(input.metadata ?? {}) },
    entities: input.entities,
    relations: input.relations,
  };
}

function entityCharacterCount(entity: RuntimeMemoryServiceContextEntity): number {
  return [entity.name, ...entity.aliases].join(' ').length;
}

function relationCharacterCount(relation: RuntimeMemoryServiceContextRelation): number {
  return `${relation.subjectName} ${relation.predicate} ${relation.objectName}`.length;
}

function applyContextLimits(
  facts: RuntimeMemoryServiceContextFact[],
  entities: RuntimeMemoryServiceContextEntity[],
  relations: RuntimeMemoryServiceContextRelation[],
  maxFacts: number,
  maxEntities: number,
  maxRelations: number,
  maxCharacters: number,
): RuntimeMemoryServiceContextResult {
  const sortedFacts = [...facts].sort((left, right) => right.score - left.score).slice(0, maxFacts);
  const sortedEntities = [...entities]
    .sort((left, right) => right.score - left.score)
    .slice(0, maxEntities);
  const sortedRelations = [...relations]
    .sort((left, right) => right.score - left.score)
    .slice(0, maxRelations);

  const items: ScoredContextItem[] = [
    ...sortedFacts.map((fact) => ({
      kind: 'fact' as const,
      score: fact.score,
      characters: fact.text.length,
      fact,
    })),
    ...sortedEntities.map((entity) => ({
      kind: 'entity' as const,
      score: entity.score,
      characters: entityCharacterCount(entity),
      entity,
    })),
    ...sortedRelations.map((relation) => ({
      kind: 'relation' as const,
      score: relation.score,
      characters: relationCharacterCount(relation),
      relation,
    })),
  ].sort((left, right) => right.score - left.score);

  const selectedFacts: RuntimeMemoryServiceContextFact[] = [];
  const selectedEntities: RuntimeMemoryServiceContextEntity[] = [];
  const selectedRelations: RuntimeMemoryServiceContextRelation[] = [];
  let totalCharacters = 0;
  let truncated =
    facts.length > maxFacts || entities.length > maxEntities || relations.length > maxRelations;

  for (const item of items) {
    if (item.kind === 'fact' && selectedFacts.length >= maxFacts) {
      truncated = true;
      continue;
    }

    if (item.kind === 'entity' && selectedEntities.length >= maxEntities) {
      truncated = true;
      continue;
    }

    if (item.kind === 'relation' && selectedRelations.length >= maxRelations) {
      truncated = true;
      continue;
    }

    if (totalCharacters + item.characters > maxCharacters && totalCharacters > 0) {
      truncated = true;
      break;
    }

    if (item.characters > maxCharacters && item.kind === 'fact' && item.fact) {
      selectedFacts.push({
        ...item.fact,
        text: item.fact.text.slice(0, maxCharacters),
      });
      totalCharacters = maxCharacters;
      truncated = true;
      break;
    }

    if (item.characters > maxCharacters) {
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
    query: '',
    factCount: selectedFacts.length,
    entityCount: selectedEntities.length,
    relationCount: selectedRelations.length,
    totalCharacters,
    truncated,
    memoryFailed: false,
    failureMessage: null,
    facts: selectedFacts,
    entities: selectedEntities,
    relations: selectedRelations,
  };
}

/**
 * Runtime-facing adapter over MemoryService for factual long-term memory.
 */
export class RuntimeMemoryServiceAdapter {
  private adapterSnapshot: RuntimeMemoryServiceSnapshot;

  constructor(
    private readonly instanceId: string,
    private readonly memoryService: MemoryService,
    private readonly maxFacts: number,
    private readonly maxEntities: number,
    private readonly maxRelations: number,
    private readonly maxCharacters: number,
  ) {
    this.adapterSnapshot = this.createEmptySnapshot();
  }

  process(input: RuntimeMemoryServiceInput) {
    try {
      const normalized = validateInput(input);
      const result = this.memoryService.process(normalized);
      const mapped = this.toProcessResult(result, false, null);
      this.touch('process', normalized.text, null);
      return serializeRuntimeMemoryServiceProcessResult(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'memory process failed';
      this.touch('process', input?.text ?? null, message);
      return serializeRuntimeMemoryServiceProcessResult(
        this.toProcessResult(
          {
            input: input?.text ?? '',
            facts: [],
            entities: [],
            relations: [],
            statistics: {
              factsSaved: 0,
              entitiesSaved: 0,
              relationsSaved: 0,
              duplicatesSkipped: 0,
              errors: 1,
              duration: 0,
            },
            errors: [{ stage: 'remember', message, source: input?.source ?? null }],
          },
          true,
          message,
        ),
      );
    }
  }

  preview(input: RuntimeMemoryServiceInput) {
    try {
      const normalized = validateInput(input);
      const result = this.memoryService.preview(normalized);
      this.touch('preview', normalized.text, null);
      return serializeRuntimeMemoryServicePreviewResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'memory preview failed';
      this.touch('preview', input?.text ?? null, message);
      return serializeRuntimeMemoryServicePreviewResult({
        input: input?.text ?? '',
        facts: [],
        entities: [],
        relations: [],
        statistics: {
          factCount: 0,
          entityCount: 0,
          relationCount: 0,
          duplicatesSkipped: 0,
          sentencesProcessed: 0,
        },
      });
    }
  }

  remember(input: RuntimeMemoryServiceRememberInput) {
    try {
      const normalized = validateRememberInput(input);
      const fact = this.memoryService.remember(normalized);
      this.touch('remember', normalized.text, null);
      return serializeRuntimeMemoryServiceRememberResult(fact, false, null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'memory remember failed';
      this.touch('remember', input?.text ?? null, message);
      return serializeRuntimeMemoryServiceRememberResult(null, true, message);
    }
  }

  search(query: string) {
    if (!isNonEmptyString(query)) {
      this.touch('search', null, 'query is required');
      return serializeRuntimeMemoryServiceSearchResult({
        facts: [],
        entities: [],
        relations: [],
      });
    }

    try {
      const result = this.memoryService.search(query);
      this.touch('search', query, null);
      return serializeRuntimeMemoryServiceSearchResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'memory search failed';
      this.touch('search', query, message);
      return serializeRuntimeMemoryServiceSearchResult({
        facts: [],
        entities: [],
        relations: [],
      });
    }
  }

  facts(filter?: MemoryFactFilter) {
    try {
      const result = this.memoryService.facts(filter);
      this.touch('facts', null, null);
      return result.map((fact) => ({
        id: fact.id,
        type: fact.type,
        text: fact.text,
        entityIds: [...fact.entityIds],
        confidence: fact.confidence,
        source: fact.source,
        createdAt: fact.createdAt,
        updatedAt: fact.updatedAt,
        metadata: fact.metadata,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'memory facts lookup failed';
      this.touch('facts', null, message);
      return [];
    }
  }

  entities(filter?: MemoryEntityFilter) {
    try {
      const result = this.memoryService.entities(filter);
      this.touch('entities', null, null);
      return result.map((entity) => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        aliases: [...entity.aliases],
        factIds: [...entity.factIds],
        relationIds: [...entity.relationIds],
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        metadata: entity.metadata,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'memory entities lookup failed';
      this.touch('entities', null, message);
      return [];
    }
  }

  relations(filter?: MemoryRelationFilter) {
    try {
      const result = this.memoryService.relations(filter);
      this.touch('relations', null, null);
      return result.map((relation) => ({
        id: relation.id,
        subjectEntityId: relation.subjectEntityId,
        predicate: relation.predicate,
        objectEntityId: relation.objectEntityId,
        factIds: [...relation.factIds],
        confidence: relation.confidence,
        createdAt: relation.createdAt,
        updatedAt: relation.updatedAt,
        metadata: relation.metadata,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'memory relations lookup failed';
      this.touch('relations', null, message);
      return [];
    }
  }

  context(query: string): SerializedRuntimeMemoryServiceContextResult {
    if (!isNonEmptyString(query)) {
      const empty = createEmptyRuntimeMemoryServiceContextResult('', 'query is required');
      this.touch('context', null, empty.failureMessage);
      return serializeRuntimeMemoryServiceContextResult(empty);
    }

    try {
      const search = this.memoryService.search(query);
      const entityNameById = new Map(
        this.memoryService.entities().map((entity) => [entity.id, entity.name]),
      );

      const facts: RuntimeMemoryServiceContextFact[] = search.facts.map((entry) => ({
        factId: entry.fact.id,
        type: entry.fact.type,
        text: entry.fact.text,
        confidence: entry.fact.confidence,
        score: entry.score,
        source: entry.fact.source,
      }));

      const entities: RuntimeMemoryServiceContextEntity[] = search.entities.map((entry) => ({
        entityId: entry.entity.id,
        name: entry.entity.name,
        type: entry.entity.type,
        aliases: [...entry.entity.aliases],
        score: entry.score,
      }));

      const relations: RuntimeMemoryServiceContextRelation[] = search.relations.map((entry) => ({
        relationId: entry.relation.id,
        subjectEntityId: entry.relation.subjectEntityId,
        subjectName:
          entityNameById.get(entry.relation.subjectEntityId) ?? entry.relation.subjectEntityId,
        predicate: entry.relation.predicate,
        objectEntityId: entry.relation.objectEntityId,
        objectName:
          entityNameById.get(entry.relation.objectEntityId) ?? entry.relation.objectEntityId,
        score: entry.score,
      }));

      const limited = applyContextLimits(
        facts,
        entities,
        relations,
        this.maxFacts,
        this.maxEntities,
        this.maxRelations,
        this.maxCharacters,
      );

      const result: RuntimeMemoryServiceContextResult = {
        ...limited,
        query,
      };

      this.touch('context', query, null);
      return serializeRuntimeMemoryServiceContextResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'memory context build failed';
      const empty = createEmptyRuntimeMemoryServiceContextResult(query, message);
      this.touch('context', query, message);
      return serializeRuntimeMemoryServiceContextResult(empty);
    }
  }

  snapshot(): RuntimeMemoryServiceSnapshot {
    return this.buildSnapshot();
  }

  serialize(): SerializedRuntimeMemoryServiceSnapshot {
    return serializeRuntimeMemoryServiceSnapshot({
      snapshot: this.buildSnapshot(),
      service: this.memoryService.serialize(),
    });
  }

  reset(): void {
    this.adapterSnapshot = this.createEmptySnapshot();
    this.updatedCounts();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  getMemoryService(): MemoryService {
    return this.memoryService;
  }

  private toProcessResult(
    result: import('@/services/memory/memory-service-types').MemoryProcessResult,
    memoryFailed: boolean,
    failureMessage: string | null,
  ): RuntimeMemoryServiceProcessResult {
    return {
      input: result.input,
      memoryFailed: memoryFailed || result.errors.length > 0,
      failureMessage: failureMessage ?? result.errors[0]?.message ?? null,
      facts: result.facts,
      entities: result.entities,
      relations: result.relations,
      statistics: result.statistics,
      errors: result.errors,
    };
  }

  private createEmptySnapshot(): RuntimeMemoryServiceSnapshot {
    return {
      instanceId: this.instanceId,
      lastOperation: null,
      lastQuery: null,
      lastInput: null,
      lastFailureMessage: null,
      factCount: 0,
      entityCount: 0,
      relationCount: 0,
      updatedAt: nowIso(),
    };
  }

  private buildSnapshot(): RuntimeMemoryServiceSnapshot {
    const serviceSnapshot = this.memoryService.snapshot();
    return {
      ...this.adapterSnapshot,
      factCount: serviceSnapshot.factCount,
      entityCount: serviceSnapshot.entityCount,
      relationCount: serviceSnapshot.relationCount,
    };
  }

  private touch(
    operation: RuntimeMemoryServiceOperation,
    queryOrInput: string | null,
    failureMessage: string | null,
  ): void {
    this.adapterSnapshot.lastOperation = operation;
    this.adapterSnapshot.lastFailureMessage = failureMessage;
    this.adapterSnapshot.updatedAt = nowIso();

    if (operation === 'search' || operation === 'context') {
      this.adapterSnapshot.lastQuery = queryOrInput;
    } else {
      this.adapterSnapshot.lastInput = queryOrInput;
    }

    this.updatedCounts();
  }

  private updatedCounts(): void {
    const serviceSnapshot = this.memoryService.snapshot();
    this.adapterSnapshot.factCount = serviceSnapshot.factCount;
    this.adapterSnapshot.entityCount = serviceSnapshot.entityCount;
    this.adapterSnapshot.relationCount = serviceSnapshot.relationCount;
  }
}

export function createRuntimeMemoryServiceAdapter(
  options?: RuntimeMemoryServiceAdapterOptions,
): RuntimeMemoryServiceAdapter {
  const instanceId = options?.instanceId?.trim() || 'default-runtime-memory-service-adapter';
  const memoryService =
    options?.memoryService ?? createMemoryService({ instanceId: `${instanceId}-memory-service` });

  return new RuntimeMemoryServiceAdapter(
    instanceId,
    memoryService,
    options?.maxFacts ?? RUNTIME_MEMORY_SERVICE_CONTEXT_MAX_FACTS,
    options?.maxEntities ?? RUNTIME_MEMORY_SERVICE_CONTEXT_MAX_ENTITIES,
    options?.maxRelations ?? RUNTIME_MEMORY_SERVICE_CONTEXT_MAX_RELATIONS,
    options?.maxCharacters ?? RUNTIME_MEMORY_SERVICE_CONTEXT_MAX_CHARACTERS,
  );
}

/** Default dev/test singleton. Runtime factual memory adapter. */
export const runtimeMemoryServiceAdapter = createRuntimeMemoryServiceAdapter();
