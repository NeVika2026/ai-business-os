import type { RuntimeMemoryServiceAdapter } from '@/services/runtime/runtime-memory-service-adapter';
import { createRuntimeMemoryServiceAdapter } from '@/services/runtime/runtime-memory-service-adapter';
import { RuntimeMemoryContextValidationError } from '@/services/runtime/runtime-memory-context-errors';
import {
  createEmptyRuntimeMemoryContextBuildResult,
  serializeRuntimeMemoryContextBuildResult,
  serializeRuntimeMemoryContextSnapshot,
} from '@/services/runtime/runtime-memory-context-serializer';
import type {
  ContextPackage,
  MemoryEntityRef,
  MemoryFactRef,
  MemoryRelationRef,
  RuntimeMemoryContextBuildResult,
  RuntimeMemoryContextOptions,
  RuntimeMemoryContextSnapshot,
  RuntimeMemoryInjectedEntity,
  RuntimeMemoryInjectedFact,
  RuntimeMemoryInjectedRelation,
  SerializedRuntimeMemoryContextBuildResult,
  SerializedRuntimeMemoryContextSnapshot,
} from '@/services/runtime/runtime-memory-context-types';
import {
  RUNTIME_MEMORY_CONTEXT_MAX_CHARACTERS,
  RUNTIME_MEMORY_CONTEXT_MAX_ENTITIES,
  RUNTIME_MEMORY_CONTEXT_MAX_FACTS,
  RUNTIME_MEMORY_CONTEXT_MAX_RELATIONS,
} from '@/services/runtime/runtime-memory-context-types';

interface ScoredMemoryItem {
  kind: 'fact' | 'entity' | 'relation';
  score: number;
  characters: number;
  fact?: RuntimeMemoryInjectedFact;
  entity?: RuntimeMemoryInjectedEntity;
  relation?: RuntimeMemoryInjectedRelation;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function dedupeFacts(facts: RuntimeMemoryInjectedFact[]): RuntimeMemoryInjectedFact[] {
  const seen = new Set<string>();
  const result: RuntimeMemoryInjectedFact[] = [];

  for (const fact of facts) {
    if (seen.has(fact.factId)) {
      continue;
    }

    seen.add(fact.factId);
    result.push(fact);
  }

  return result;
}

function dedupeEntities(entities: RuntimeMemoryInjectedEntity[]): RuntimeMemoryInjectedEntity[] {
  const seen = new Set<string>();
  const result: RuntimeMemoryInjectedEntity[] = [];

  for (const entity of entities) {
    if (seen.has(entity.entityId)) {
      continue;
    }

    seen.add(entity.entityId);
    result.push(entity);
  }

  return result;
}

function dedupeRelations(
  relations: RuntimeMemoryInjectedRelation[],
): RuntimeMemoryInjectedRelation[] {
  const seen = new Set<string>();
  const result: RuntimeMemoryInjectedRelation[] = [];

  for (const relation of relations) {
    if (seen.has(relation.relationId)) {
      continue;
    }

    seen.add(relation.relationId);
    result.push(relation);
  }

  return result;
}

function entityCharacterCount(entity: RuntimeMemoryInjectedEntity): number {
  return [entity.name, ...entity.aliases].join(' ').length;
}

function relationCharacterCount(relation: RuntimeMemoryInjectedRelation): number {
  return `${relation.subjectName} ${relation.predicate} ${relation.objectName}`.length;
}

function applyInjectionLimits(
  facts: RuntimeMemoryInjectedFact[],
  entities: RuntimeMemoryInjectedEntity[],
  relations: RuntimeMemoryInjectedRelation[],
  maxFacts: number,
  maxEntities: number,
  maxRelations: number,
  maxCharacters: number,
): {
  facts: RuntimeMemoryInjectedFact[];
  entities: RuntimeMemoryInjectedEntity[];
  relations: RuntimeMemoryInjectedRelation[];
  truncated: boolean;
  totalCharacters: number;
} {
  const sortedFacts = [...facts].sort((left, right) => right.score - left.score);
  const sortedEntities = [...entities].sort((left, right) => right.score - left.score);
  const sortedRelations = [...relations].sort((left, right) => right.score - left.score);

  const items: ScoredMemoryItem[] = [
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

  const selectedFacts: RuntimeMemoryInjectedFact[] = [];
  const selectedEntities: RuntimeMemoryInjectedEntity[] = [];
  const selectedRelations: RuntimeMemoryInjectedRelation[] = [];
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
    facts: selectedFacts,
    entities: selectedEntities,
    relations: selectedRelations,
    truncated,
    totalCharacters,
  };
}

function toMemoryFactRef(fact: RuntimeMemoryInjectedFact): MemoryFactRef {
  return {
    factId: fact.factId,
    type: fact.type,
    text: fact.text,
    confidence: fact.confidence,
    score: fact.score,
    source: fact.source,
  };
}

function toMemoryEntityRef(entity: RuntimeMemoryInjectedEntity): MemoryEntityRef {
  return {
    entityId: entity.entityId,
    name: entity.name,
    type: entity.type,
    aliases: [...entity.aliases],
    score: entity.score,
  };
}

function toMemoryRelationRef(relation: RuntimeMemoryInjectedRelation): MemoryRelationRef {
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

function readExistingMemoryFacts(payload: Record<string, unknown>): MemoryFactRef[] {
  return readArrayFromPayload<MemoryFactRef>(payload.memoryFacts, (entry) => ({
    factId: typeof entry.factId === 'string' ? entry.factId : '',
    type: typeof entry.type === 'string' ? entry.type : '',
    text: typeof entry.text === 'string' ? entry.text : '',
    confidence: typeof entry.confidence === 'number' ? entry.confidence : 0,
    score: typeof entry.score === 'number' ? entry.score : 0,
    source: typeof entry.source === 'string' ? entry.source : '',
  })).filter((entry) => entry.factId.length > 0);
}

function readExistingMemoryEntities(payload: Record<string, unknown>): MemoryEntityRef[] {
  return readArrayFromPayload<MemoryEntityRef>(payload.memoryEntities, (entry) => ({
    entityId: typeof entry.entityId === 'string' ? entry.entityId : '',
    name: typeof entry.name === 'string' ? entry.name : '',
    type: typeof entry.type === 'string' ? entry.type : '',
    aliases: Array.isArray(entry.aliases)
      ? entry.aliases.filter((value): value is string => typeof value === 'string')
      : [],
    score: typeof entry.score === 'number' ? entry.score : 0,
  })).filter((entry) => entry.entityId.length > 0);
}

function readExistingMemoryRelations(payload: Record<string, unknown>): MemoryRelationRef[] {
  return readArrayFromPayload<MemoryRelationRef>(payload.memoryRelations, (entry) => ({
    relationId: typeof entry.relationId === 'string' ? entry.relationId : '',
    subjectEntityId: typeof entry.subjectEntityId === 'string' ? entry.subjectEntityId : '',
    subjectName: typeof entry.subjectName === 'string' ? entry.subjectName : '',
    predicate: typeof entry.predicate === 'string' ? entry.predicate : '',
    objectEntityId: typeof entry.objectEntityId === 'string' ? entry.objectEntityId : '',
    objectName: typeof entry.objectName === 'string' ? entry.objectName : '',
    score: typeof entry.score === 'number' ? entry.score : 0,
  })).filter((entry) => entry.relationId.length > 0);
}

function readArrayFromPayload<T>(
  raw: unknown,
  mapEntry: (entry: Record<string, unknown>) => T,
): T[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object',
    )
    .map(mapEntry);
}

/**
 * Runtime memory context injection layer over RuntimeMemoryServiceAdapter.
 */
export class RuntimeMemoryContext {
  private enabled: boolean;
  private snapshot: RuntimeMemoryContextSnapshot = {
    lastQuery: null,
    lastFactCount: null,
    lastEntityCount: null,
    lastRelationCount: null,
    lastTotalCharacters: null,
    lastMemoryFailed: null,
    lastFailureMessage: null,
    enabled: false,
    updatedAt: new Date().toISOString(),
  };

  constructor(
    private readonly instanceId: string,
    private readonly memoryServiceAdapter: RuntimeMemoryServiceAdapter,
    enabled: boolean,
    private readonly maxFacts: number,
    private readonly maxEntities: number,
    private readonly maxRelations: number,
    private readonly maxCharacters: number,
  ) {
    this.enabled = enabled;
    this.snapshot.enabled = enabled;
  }

  build(query: string): RuntimeMemoryContextBuildResult {
    const normalizedQuery = query?.trim() ?? '';

    if (!this.enabled) {
      const empty = createEmptyRuntimeMemoryContextBuildResult(normalizedQuery, false);
      this.storeSnapshot(normalizedQuery, empty);
      return empty;
    }

    return this.buildInjection(normalizedQuery);
  }

  mergeMemory(context: ContextPackage, query: string): ContextPackage {
    const injection = this.buildInjection(query?.trim() ?? '');

    if (!injection.enabled || injection.memoryFailed) {
      return context;
    }

    if (
      injection.facts.length === 0 &&
      injection.entities.length === 0 &&
      injection.relations.length === 0
    ) {
      return context;
    }

    const existingFacts = readExistingMemoryFacts(context.userIntent.payload);
    const existingEntities = readExistingMemoryEntities(context.userIntent.payload);
    const existingRelations = readExistingMemoryRelations(context.userIntent.payload);

    const factMap = new Map<string, MemoryFactRef>();
    const entityMap = new Map<string, MemoryEntityRef>();
    const relationMap = new Map<string, MemoryRelationRef>();

    for (const fact of existingFacts) {
      factMap.set(fact.factId, fact);
    }

    for (const entity of existingEntities) {
      entityMap.set(entity.entityId, entity);
    }

    for (const relation of existingRelations) {
      relationMap.set(relation.relationId, relation);
    }

    for (const fact of injection.facts.map(toMemoryFactRef)) {
      factMap.set(fact.factId, fact);
    }

    for (const entity of injection.entities.map(toMemoryEntityRef)) {
      entityMap.set(entity.entityId, entity);
    }

    for (const relation of injection.relations.map(toMemoryRelationRef)) {
      relationMap.set(relation.relationId, relation);
    }

    const mergedFacts = [...factMap.values()].sort((left, right) => right.score - left.score);
    const mergedEntities = [...entityMap.values()].sort((left, right) => right.score - left.score);
    const mergedRelations = [...relationMap.values()].sort(
      (left, right) => right.score - left.score,
    );

    return {
      ...context,
      userIntent: {
        ...context.userIntent,
        payload: {
          ...context.userIntent.payload,
          memoryFacts: mergedFacts,
          memoryEntities: mergedEntities,
          memoryRelations: mergedRelations,
        },
      },
    };
  }

  serialize(): SerializedRuntimeMemoryContextSnapshot {
    return serializeRuntimeMemoryContextSnapshot({
      instanceId: this.instanceId,
      snapshot: this.snapshot,
    });
  }

  serializeBuildResult(
    result: RuntimeMemoryContextBuildResult,
  ): SerializedRuntimeMemoryContextBuildResult {
    return serializeRuntimeMemoryContextBuildResult(result);
  }

  reset(): void {
    this.snapshot = {
      lastQuery: null,
      lastFactCount: null,
      lastEntityCount: null,
      lastRelationCount: null,
      lastTotalCharacters: null,
      lastMemoryFailed: null,
      lastFailureMessage: null,
      enabled: this.enabled,
      updatedAt: new Date().toISOString(),
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.snapshot.enabled = enabled;
    this.snapshot.updatedAt = new Date().toISOString();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private buildInjection(normalizedQuery: string): RuntimeMemoryContextBuildResult {
    if (!isNonEmptyString(normalizedQuery)) {
      const empty = createEmptyRuntimeMemoryContextBuildResult(normalizedQuery, true);
      this.storeSnapshot(normalizedQuery, empty);
      return empty;
    }

    try {
      const contextResult = this.memoryServiceAdapter.context(normalizedQuery);
      const facts = dedupeFacts(
        contextResult.facts.map((fact) => ({
          factId: fact.factId,
          type: fact.type,
          text: fact.text,
          confidence: fact.confidence,
          score: fact.score,
          source: fact.source,
        })),
      );
      const entities = dedupeEntities(
        contextResult.entities.map((entity) => ({
          entityId: entity.entityId,
          name: entity.name,
          type: entity.type,
          aliases: [...entity.aliases],
          score: entity.score,
        })),
      );
      const relations = dedupeRelations(
        contextResult.relations.map((relation) => ({
          relationId: relation.relationId,
          subjectEntityId: relation.subjectEntityId,
          subjectName: relation.subjectName,
          predicate: relation.predicate,
          objectEntityId: relation.objectEntityId,
          objectName: relation.objectName,
          score: relation.score,
        })),
      );

      const limited = applyInjectionLimits(
        facts,
        entities,
        relations,
        this.maxFacts,
        this.maxEntities,
        this.maxRelations,
        this.maxCharacters,
      );

      const result: RuntimeMemoryContextBuildResult = {
        enabled: true,
        query: normalizedQuery,
        factCount: limited.facts.length,
        entityCount: limited.entities.length,
        relationCount: limited.relations.length,
        totalCharacters: limited.totalCharacters,
        truncated: limited.truncated || contextResult.truncated,
        memoryFailed: contextResult.memoryFailed,
        failureMessage: contextResult.failureMessage,
        facts: limited.facts,
        entities: limited.entities,
        relations: limited.relations,
      };

      this.storeSnapshot(normalizedQuery, result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Memory context build failed';
      const failed: RuntimeMemoryContextBuildResult = {
        enabled: true,
        query: normalizedQuery,
        factCount: 0,
        entityCount: 0,
        relationCount: 0,
        totalCharacters: 0,
        truncated: false,
        memoryFailed: true,
        failureMessage: message,
        facts: [],
        entities: [],
        relations: [],
      };
      this.storeSnapshot(normalizedQuery, failed);
      return failed;
    }
  }

  private storeSnapshot(query: string, result: RuntimeMemoryContextBuildResult): void {
    this.snapshot = {
      lastQuery: query || null,
      lastFactCount: result.factCount,
      lastEntityCount: result.entityCount,
      lastRelationCount: result.relationCount,
      lastTotalCharacters: result.totalCharacters,
      lastMemoryFailed: result.memoryFailed,
      lastFailureMessage: result.failureMessage,
      enabled: result.enabled,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimeMemoryContext(
  options?: RuntimeMemoryContextOptions,
): RuntimeMemoryContext {
  const instanceId = options?.instanceId?.trim() || 'default-runtime-memory-context';
  const enabled = options?.enabled ?? false;
  const maxFacts = options?.maxFacts ?? RUNTIME_MEMORY_CONTEXT_MAX_FACTS;
  const maxEntities = options?.maxEntities ?? RUNTIME_MEMORY_CONTEXT_MAX_ENTITIES;
  const maxRelations = options?.maxRelations ?? RUNTIME_MEMORY_CONTEXT_MAX_RELATIONS;
  const maxCharacters = options?.maxCharacters ?? RUNTIME_MEMORY_CONTEXT_MAX_CHARACTERS;
  const memoryServiceAdapter =
    options?.memoryServiceAdapter ??
    createRuntimeMemoryServiceAdapter({ instanceId: `${instanceId}-adapter` });

  if (maxFacts <= 0) {
    throw new RuntimeMemoryContextValidationError('maxFacts must be greater than 0');
  }

  if (maxEntities <= 0) {
    throw new RuntimeMemoryContextValidationError('maxEntities must be greater than 0');
  }

  if (maxRelations <= 0) {
    throw new RuntimeMemoryContextValidationError('maxRelations must be greater than 0');
  }

  if (maxCharacters <= 0) {
    throw new RuntimeMemoryContextValidationError('maxCharacters must be greater than 0');
  }

  return new RuntimeMemoryContext(
    instanceId,
    memoryServiceAdapter,
    enabled,
    maxFacts,
    maxEntities,
    maxRelations,
    maxCharacters,
  );
}

/** Default dev/test singleton. In-memory only. */
export const runtimeMemoryContext = createRuntimeMemoryContext();
