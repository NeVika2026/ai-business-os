import { createHash } from 'node:crypto';

import {
  MemoryConflictError,
  MemoryNotFoundError,
  MemoryValidationError,
} from '@/services/memory/memory-engine-errors';
import { serializeMemoryEngineSnapshot } from '@/services/memory/memory-engine-serializer';
import type {
  MemoryEngineOptions,
  MemoryEngineSnapshot,
  MemoryEntity,
  MemoryEntityFilter,
  MemoryEntityPatch,
  MemoryEntityType,
  MemoryFact,
  MemoryFactFilter,
  MemoryFactPatch,
  MemoryRelation,
  MemoryRelationFilter,
  MemoryRelationPatch,
  MemorySearchEntityResult,
  MemorySearchFactResult,
  MemorySearchMatchReason,
  MemorySearchRelationResult,
  MemorySearchResult,
  MemoryType,
  RememberInput,
  SerializedMemoryEngineSnapshot,
} from '@/services/memory/memory-engine-types';
import { MEMORY_TYPES } from '@/services/memory/memory-engine-types';

const DEFAULT_CONFIDENCE = 0.8;
const MEMORY_TYPE_SET = new Set<string>(MEMORY_TYPES);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeFactText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizePredicate(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function createFactId(type: MemoryType, text: string): string {
  return createHash('sha256')
    .update(`fact:${type}:${normalizeFactText(text)}`)
    .digest('hex')
    .slice(0, 32);
}

function createEntityId(name: string): string {
  return createHash('sha256')
    .update(`entity:${normalizeName(name)}`)
    .digest('hex')
    .slice(0, 32);
}

function createRelationId(
  subjectEntityId: string,
  predicate: string,
  objectEntityId: string,
): string {
  return createHash('sha256')
    .update(`relation:${subjectEntityId}:${normalizePredicate(predicate)}:${objectEntityId}`)
    .digest('hex')
    .slice(0, 32);
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

function assertConfidence(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new MemoryValidationError('confidence must be between 0 and 1');
  }
}

function assertMemoryType(value: unknown): asserts value is MemoryType {
  if (!isNonEmptyString(value) || !MEMORY_TYPE_SET.has(value)) {
    throw new MemoryValidationError(`unknown memory type: ${String(value)}`);
  }
}

function assertEntityType(value: unknown): asserts value is MemoryEntityType {
  const allowed: MemoryEntityType[] = [
    'person',
    'company',
    'project',
    'document',
    'task',
    'goal',
    'event',
    'contact',
    'lead',
    'client',
    'organization',
    'generic',
  ];

  if (!isNonEmptyString(value) || !allowed.includes(value as MemoryEntityType)) {
    throw new MemoryValidationError(`unknown entity type: ${String(value)}`);
  }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function mergeMetadata(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...left,
    ...right,
  };
}

/**
 * Deterministic in-memory factual memory engine.
 */
export class MemoryEngine {
  private readonly factStore = new Map<string, MemoryFact>();
  private readonly entityStore = new Map<string, MemoryEntity>();
  private readonly relationStore = new Map<string, MemoryRelation>();
  private readonly aliasIndex = new Map<string, string>();
  private updatedAt = nowIso();

  constructor(
    private readonly instanceId: string,
    private readonly defaultConfidence: number,
  ) {}

  remember(input: RememberInput): MemoryFact {
    this.validateRememberInput(input);

    const confidence = input.confidence ?? this.defaultConfidence;
    assertConfidence(confidence);

    const timestamp = nowIso();
    const factId = createFactId(input.type, input.text);
    const existingFact = this.factStore.get(factId);
    const linkedEntityIds: string[] = [];

    for (const entityInput of input.entities ?? []) {
      const entity = this.resolveOrCreateEntity(entityInput, timestamp);
      linkedEntityIds.push(entity.id);
    }

    for (const relationInput of input.relations ?? []) {
      const relation = this.resolveOrCreateRelation(relationInput, timestamp, factId);
      linkedEntityIds.push(relation.subjectEntityId, relation.objectEntityId);
    }

    const uniqueEntityIds = uniqueStrings(linkedEntityIds);

    if (existingFact) {
      existingFact.confidence = Math.max(existingFact.confidence, confidence);
      existingFact.source = input.source?.trim() || existingFact.source;
      existingFact.metadata = mergeMetadata(existingFact.metadata, input.metadata ?? {});
      existingFact.entityIds = uniqueStrings([...existingFact.entityIds, ...uniqueEntityIds]);
      existingFact.updatedAt = timestamp;
      this.linkFactToEntities(existingFact);
      this.touch();
      return existingFact;
    }

    const fact: MemoryFact = {
      id: factId,
      type: input.type,
      text: input.text.trim(),
      entityIds: uniqueEntityIds,
      confidence,
      source: input.source?.trim() || 'memory-engine',
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: { ...(input.metadata ?? {}) },
    };

    this.factStore.set(fact.id, fact);
    this.linkFactToEntities(fact);
    this.touch();
    return fact;
  }

  forget(id: string): void {
    if (!isNonEmptyString(id)) {
      throw new MemoryValidationError('id is required');
    }

    if (this.factStore.has(id)) {
      this.forgetFact(id);
      this.touch();
      return;
    }

    if (this.entityStore.has(id)) {
      this.forgetEntity(id);
      this.touch();
      return;
    }

    if (this.relationStore.has(id)) {
      this.forgetRelation(id);
      this.touch();
      return;
    }

    throw new MemoryNotFoundError(`memory item not found: ${id}`);
  }

  update(
    id: string,
    patch: MemoryFactPatch | MemoryEntityPatch | MemoryRelationPatch,
  ): MemoryFact | MemoryEntity | MemoryRelation {
    if (!isNonEmptyString(id)) {
      throw new MemoryValidationError('id is required');
    }

    if (this.factStore.has(id)) {
      return this.updateFact(id, patch as MemoryFactPatch);
    }

    if (this.entityStore.has(id)) {
      return this.updateEntity(id, patch as MemoryEntityPatch);
    }

    if (this.relationStore.has(id)) {
      return this.updateRelation(id, patch as MemoryRelationPatch);
    }

    throw new MemoryNotFoundError(`memory item not found: ${id}`);
  }

  search(query: string): MemorySearchResult {
    if (!isNonEmptyString(query)) {
      throw new MemoryValidationError('query is required');
    }

    const terms = tokenize(query);
    if (terms.length === 0) {
      return { facts: [], entities: [], relations: [] };
    }

    const facts = [...this.factStore.values()]
      .map((fact) => this.scoreFact(fact, terms))
      .filter((entry): entry is MemorySearchFactResult => entry !== null)
      .sort((left, right) => right.score - left.score);

    const entities = [...this.entityStore.values()]
      .map((entity) => this.scoreEntity(entity, terms))
      .filter((entry): entry is MemorySearchEntityResult => entry !== null)
      .sort((left, right) => right.score - left.score);

    const relations = [...this.relationStore.values()]
      .map((relation) => this.scoreRelation(relation, terms))
      .filter((entry): entry is MemorySearchRelationResult => entry !== null)
      .sort((left, right) => right.score - left.score);

    return { facts, entities, relations };
  }

  facts(filter?: MemoryFactFilter): MemoryFact[] {
    return [...this.factStore.values()]
      .filter((fact) => this.matchesFactFilter(fact, filter))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  entities(filter?: MemoryEntityFilter): MemoryEntity[] {
    return [...this.entityStore.values()]
      .filter((entity) => this.matchesEntityFilter(entity, filter))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  relations(filter?: MemoryRelationFilter): MemoryRelation[] {
    return [...this.relationStore.values()]
      .filter((relation) => this.matchesRelationFilter(relation, filter))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  snapshot(): MemoryEngineSnapshot {
    return this.buildSnapshot();
  }

  serialize(): SerializedMemoryEngineSnapshot {
    return serializeMemoryEngineSnapshot({
      snapshot: this.buildSnapshot(),
      facts: this.facts(),
      entities: this.entities(),
      relations: this.relations(),
    });
  }

  reset(): void {
    this.factStore.clear();
    this.entityStore.clear();
    this.relationStore.clear();
    this.aliasIndex.clear();
    this.touch();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private validateRememberInput(input: RememberInput): void {
    if (!input || typeof input !== 'object') {
      throw new MemoryValidationError('remember input must be an object');
    }

    assertMemoryType(input.type);

    if (!isNonEmptyString(input.text)) {
      throw new MemoryValidationError('fact text is required');
    }

    if (input.confidence !== undefined) {
      assertConfidence(input.confidence);
    }

    for (const relation of input.relations ?? []) {
      if (!isNonEmptyString(relation.subject)) {
        throw new MemoryValidationError('relation subject is required');
      }

      if (!isNonEmptyString(relation.object)) {
        throw new MemoryValidationError('relation object is required');
      }

      if (!isNonEmptyString(relation.predicate)) {
        throw new MemoryValidationError('relation predicate is required');
      }

      if (relation.confidence !== undefined) {
        assertConfidence(relation.confidence);
      }
    }

    for (const entity of input.entities ?? []) {
      if (!isNonEmptyString(entity.name)) {
        throw new MemoryValidationError('entity name is required');
      }

      if (entity.type !== undefined) {
        assertEntityType(entity.type);
      }
    }
  }

  private resolveOrCreateEntity(
    input: {
      name: string;
      type?: MemoryEntityType;
      aliases?: string[];
      metadata?: Record<string, unknown>;
    },
    timestamp: string,
  ): MemoryEntity {
    const namesToCheck = uniqueStrings([input.name, ...(input.aliases ?? [])]);
    let existingId: string | null = null;

    for (const name of namesToCheck) {
      const found = this.aliasIndex.get(normalizeName(name));
      if (found) {
        existingId = found;
        break;
      }
    }

    if (existingId) {
      const entity = this.entityStore.get(existingId);
      if (!entity) {
        throw new MemoryNotFoundError(`entity not found: ${existingId}`);
      }

      const mergedAliases = uniqueStrings([
        ...entity.aliases,
        input.name,
        ...(input.aliases ?? []),
      ]).filter((alias) => normalizeName(alias) !== normalizeName(entity.name));

      entity.aliases = mergedAliases;
      entity.metadata = mergeMetadata(entity.metadata, input.metadata ?? {});

      if (input.type && entity.type === 'generic') {
        entity.type = input.type;
      } else if (input.type && entity.type !== input.type) {
        throw new MemoryConflictError(
          `entity type conflict for ${entity.name}: ${entity.type} vs ${input.type}`,
        );
      }

      entity.updatedAt = timestamp;
      this.registerEntityAliases(entity);
      return entity;
    }

    const entity: MemoryEntity = {
      id: createEntityId(input.name),
      name: input.name.trim(),
      type: input.type ?? 'generic',
      aliases: uniqueStrings(input.aliases ?? []).filter(
        (alias) => normalizeName(alias) !== normalizeName(input.name),
      ),
      factIds: [],
      relationIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: { ...(input.metadata ?? {}) },
    };

    this.entityStore.set(entity.id, entity);
    this.registerEntityAliases(entity);
    return entity;
  }

  private resolveEntityByName(name: string, timestamp: string): MemoryEntity {
    const existingId = this.aliasIndex.get(normalizeName(name));
    if (existingId) {
      const entity = this.entityStore.get(existingId);
      if (entity) {
        return entity;
      }
    }

    return this.resolveOrCreateEntity({ name }, timestamp);
  }

  private resolveOrCreateRelation(
    input: {
      subject: string;
      predicate: string;
      object: string;
      confidence?: number;
      metadata?: Record<string, unknown>;
    },
    timestamp: string,
    factId: string,
  ): MemoryRelation {
    const subjectEntity = this.resolveEntityByName(input.subject, timestamp);
    const objectEntity = this.resolveEntityByName(input.object, timestamp);
    const predicate = normalizePredicate(input.predicate);
    const confidence = input.confidence ?? this.defaultConfidence;
    assertConfidence(confidence);

    const relationId = createRelationId(subjectEntity.id, predicate, objectEntity.id);
    const existing = this.relationStore.get(relationId);

    if (existing) {
      existing.confidence = Math.max(existing.confidence, confidence);
      existing.metadata = mergeMetadata(existing.metadata, input.metadata ?? {});
      existing.factIds = uniqueStrings([...existing.factIds, factId]);
      existing.updatedAt = timestamp;
      this.linkRelationToEntities(existing);
      return existing;
    }

    const relation: MemoryRelation = {
      id: relationId,
      subjectEntityId: subjectEntity.id,
      predicate,
      objectEntityId: objectEntity.id,
      factIds: [factId],
      confidence,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: { ...(input.metadata ?? {}) },
    };

    this.relationStore.set(relation.id, relation);
    this.linkRelationToEntities(relation);
    return relation;
  }

  private linkFactToEntities(fact: MemoryFact): void {
    for (const entityId of fact.entityIds) {
      const entity = this.entityStore.get(entityId);
      if (!entity) {
        continue;
      }

      entity.factIds = uniqueStrings([...entity.factIds, fact.id]);
      entity.updatedAt = fact.updatedAt;
    }
  }

  private linkRelationToEntities(relation: MemoryRelation): void {
    for (const entityId of [relation.subjectEntityId, relation.objectEntityId]) {
      const entity = this.entityStore.get(entityId);
      if (!entity) {
        continue;
      }

      entity.relationIds = uniqueStrings([...entity.relationIds, relation.id]);
      entity.updatedAt = relation.updatedAt;
    }
  }

  private registerEntityAliases(entity: MemoryEntity): void {
    this.aliasIndex.set(normalizeName(entity.name), entity.id);

    for (const alias of entity.aliases) {
      this.aliasIndex.set(normalizeName(alias), entity.id);
    }
  }

  private forgetFact(id: string): void {
    const fact = this.factStore.get(id);
    if (!fact) {
      throw new MemoryNotFoundError(`fact not found: ${id}`);
    }

    for (const entity of this.entityStore.values()) {
      entity.factIds = entity.factIds.filter((factId) => factId !== id);
    }

    for (const relation of this.relationStore.values()) {
      relation.factIds = relation.factIds.filter((factId) => factId !== id);
    }

    this.factStore.delete(id);
  }

  private forgetEntity(id: string): void {
    const entity = this.entityStore.get(id);
    if (!entity) {
      throw new MemoryNotFoundError(`entity not found: ${id}`);
    }

    for (const factId of entity.factIds) {
      const fact = this.factStore.get(factId);
      if (fact) {
        fact.entityIds = fact.entityIds.filter((entityId) => entityId !== id);
      }
    }

    for (const relationId of entity.relationIds) {
      this.forgetRelation(relationId, false);
    }

    for (const [alias, entityId] of this.aliasIndex.entries()) {
      if (entityId === id) {
        this.aliasIndex.delete(alias);
      }
    }

    this.entityStore.delete(id);
  }

  private forgetRelation(id: string, removeFromEntities = true): void {
    const relation = this.relationStore.get(id);
    if (!relation) {
      throw new MemoryNotFoundError(`relation not found: ${id}`);
    }

    if (removeFromEntities) {
      for (const entityId of [relation.subjectEntityId, relation.objectEntityId]) {
        const entity = this.entityStore.get(entityId);
        if (entity) {
          entity.relationIds = entity.relationIds.filter((relationId) => relationId !== id);
        }
      }
    }

    this.relationStore.delete(id);
  }

  private updateFact(id: string, patch: MemoryFactPatch): MemoryFact {
    const fact = this.factStore.get(id);
    if (!fact) {
      throw new MemoryNotFoundError(`fact not found: ${id}`);
    }

    const nextType = patch.type ?? fact.type;
    const nextText = patch.text?.trim() ?? fact.text;

    if (!isNonEmptyString(nextText)) {
      throw new MemoryValidationError('fact text is required');
    }

    if (patch.type !== undefined) {
      assertMemoryType(patch.type);
    }

    if (patch.confidence !== undefined) {
      assertConfidence(patch.confidence);
    }

    const nextId = createFactId(nextType, nextText);
    if (nextId !== id && this.factStore.has(nextId)) {
      throw new MemoryConflictError('updated fact would duplicate an existing fact');
    }

    const updated: MemoryFact = {
      ...fact,
      id: nextId,
      type: nextType,
      text: nextText,
      confidence: patch.confidence ?? fact.confidence,
      source: patch.source?.trim() || fact.source,
      metadata: patch.metadata ? mergeMetadata(fact.metadata, patch.metadata) : fact.metadata,
      createdAt: fact.createdAt,
      updatedAt: nowIso(),
    };

    if (nextId !== id) {
      this.factStore.delete(id);
      this.relinkFactId(id, nextId);
    }

    this.factStore.set(updated.id, updated);
    this.touch();
    return updated;
  }

  private updateEntity(id: string, patch: MemoryEntityPatch): MemoryEntity {
    const entity = this.entityStore.get(id);
    if (!entity) {
      throw new MemoryNotFoundError(`entity not found: ${id}`);
    }

    if (patch.type !== undefined) {
      assertEntityType(patch.type);
    }

    const nextName = patch.name?.trim() ?? entity.name;
    if (!isNonEmptyString(nextName)) {
      throw new MemoryValidationError('entity name is required');
    }

    const nextAliases = patch.aliases ? uniqueStrings(patch.aliases) : entity.aliases;

    for (const [alias, entityId] of this.aliasIndex.entries()) {
      if (entityId === id) {
        this.aliasIndex.delete(alias);
      }
    }

    entity.name = nextName;
    entity.type = patch.type ?? entity.type;
    entity.aliases = nextAliases.filter(
      (alias) => normalizeName(alias) !== normalizeName(nextName),
    );
    entity.metadata = patch.metadata
      ? mergeMetadata(entity.metadata, patch.metadata)
      : entity.metadata;
    entity.createdAt = entity.createdAt;
    entity.updatedAt = nowIso();
    this.registerEntityAliases(entity);
    this.touch();
    return entity;
  }

  private updateRelation(id: string, patch: MemoryRelationPatch): MemoryRelation {
    const relation = this.relationStore.get(id);
    if (!relation) {
      throw new MemoryNotFoundError(`relation not found: ${id}`);
    }

    if (patch.confidence !== undefined) {
      assertConfidence(patch.confidence);
    }

    const nextPredicate = patch.predicate
      ? normalizePredicate(patch.predicate)
      : relation.predicate;
    if (!isNonEmptyString(nextPredicate)) {
      throw new MemoryValidationError('relation predicate is required');
    }

    const nextId = createRelationId(
      relation.subjectEntityId,
      nextPredicate,
      relation.objectEntityId,
    );

    if (nextId !== id && this.relationStore.has(nextId)) {
      throw new MemoryConflictError('updated relation would duplicate an existing relation');
    }

    const updated: MemoryRelation = {
      ...relation,
      id: nextId,
      predicate: nextPredicate,
      confidence: patch.confidence ?? relation.confidence,
      metadata: patch.metadata
        ? mergeMetadata(relation.metadata, patch.metadata)
        : relation.metadata,
      createdAt: relation.createdAt,
      updatedAt: nowIso(),
    };

    if (nextId !== id) {
      this.relationStore.delete(id);
      this.relinkRelationId(id, nextId);
    }

    this.relationStore.set(updated.id, updated);
    this.linkRelationToEntities(updated);
    this.touch();
    return updated;
  }

  private relinkFactId(oldId: string, newId: string): void {
    for (const entity of this.entityStore.values()) {
      entity.factIds = entity.factIds.map((factId) => (factId === oldId ? newId : factId));
    }

    for (const relation of this.relationStore.values()) {
      relation.factIds = relation.factIds.map((factId) => (factId === oldId ? newId : factId));
    }
  }

  private relinkRelationId(oldId: string, newId: string): void {
    for (const entity of this.entityStore.values()) {
      entity.relationIds = entity.relationIds.map((relationId) =>
        relationId === oldId ? newId : relationId,
      );
    }
  }

  private scoreFact(fact: MemoryFact, terms: string[]): MemorySearchFactResult | null {
    const reasons: MemorySearchMatchReason[] = [];
    let score = 0;
    const factTokens = new Set(tokenize(fact.text));
    const metadataTokens = new Set(metadataKeywords(fact.metadata));

    for (const term of terms) {
      if (fact.text.toLowerCase().includes(term)) {
        score += 4;
        reasons.push({ field: 'text', value: term });
      } else if (factTokens.has(term)) {
        score += 3;
        reasons.push({ field: 'text', value: term });
      } else if (metadataTokens.has(term)) {
        score += 1;
        reasons.push({ field: 'metadata', value: term });
      }
    }

    return score > 0 ? { fact, score, reason: reasons } : null;
  }

  private scoreEntity(entity: MemoryEntity, terms: string[]): MemorySearchEntityResult | null {
    const reasons: MemorySearchMatchReason[] = [];
    let score = 0;
    const metadataTokens = new Set(metadataKeywords(entity.metadata));
    const names = [entity.name, ...entity.aliases];

    for (const term of terms) {
      for (const name of names) {
        if (normalizeName(name) === term) {
          score += 5;
          reasons.push({ field: 'name', value: name });
          continue;
        }

        if (name.toLowerCase().includes(term)) {
          score += 4;
          reasons.push({ field: 'alias', value: name });
        }
      }

      if (metadataTokens.has(term)) {
        score += 1;
        reasons.push({ field: 'metadata', value: term });
      }
    }

    return score > 0 ? { entity, score, reason: reasons } : null;
  }

  private scoreRelation(
    relation: MemoryRelation,
    terms: string[],
  ): MemorySearchRelationResult | null {
    const reasons: MemorySearchMatchReason[] = [];
    let score = 0;
    const metadataTokens = new Set(metadataKeywords(relation.metadata));
    const predicateTokens = tokenize(relation.predicate.replace(/_/g, ' '));

    for (const term of terms) {
      if (relation.predicate.includes(term)) {
        score += 4;
        reasons.push({ field: 'predicate', value: term });
      } else if (predicateTokens.includes(term)) {
        score += 3;
        reasons.push({ field: 'predicate', value: term });
      } else if (metadataTokens.has(term)) {
        score += 1;
        reasons.push({ field: 'metadata', value: term });
      }
    }

    return score > 0 ? { relation, score, reason: reasons } : null;
  }

  private matchesFactFilter(fact: MemoryFact, filter?: MemoryFactFilter): boolean {
    if (!filter) {
      return true;
    }

    if (filter.type && fact.type !== filter.type) {
      return false;
    }

    if (filter.entityId && !fact.entityIds.includes(filter.entityId)) {
      return false;
    }

    if (filter.source && fact.source !== filter.source) {
      return false;
    }

    if (filter.text && !fact.text.toLowerCase().includes(filter.text.toLowerCase())) {
      return false;
    }

    return true;
  }

  private matchesEntityFilter(entity: MemoryEntity, filter?: MemoryEntityFilter): boolean {
    if (!filter) {
      return true;
    }

    if (filter.type && entity.type !== filter.type) {
      return false;
    }

    if (filter.name && normalizeName(entity.name) !== normalizeName(filter.name)) {
      return false;
    }

    if (filter.alias) {
      const normalized = normalizeName(filter.alias);
      const matchesAlias =
        normalizeName(entity.name) === normalized ||
        entity.aliases.some((alias) => normalizeName(alias) === normalized);

      if (!matchesAlias) {
        return false;
      }
    }

    return true;
  }

  private matchesRelationFilter(relation: MemoryRelation, filter?: MemoryRelationFilter): boolean {
    if (!filter) {
      return true;
    }

    if (filter.subjectEntityId && relation.subjectEntityId !== filter.subjectEntityId) {
      return false;
    }

    if (filter.objectEntityId && relation.objectEntityId !== filter.objectEntityId) {
      return false;
    }

    if (filter.predicate && relation.predicate !== normalizePredicate(filter.predicate)) {
      return false;
    }

    return true;
  }

  private buildSnapshot(): MemoryEngineSnapshot {
    return {
      instanceId: this.instanceId,
      factCount: this.factStore.size,
      entityCount: this.entityStore.size,
      relationCount: this.relationStore.size,
      updatedAt: this.updatedAt,
    };
  }

  private touch(): void {
    this.updatedAt = nowIso();
  }
}

export function createMemoryEngine(options?: MemoryEngineOptions): MemoryEngine {
  const instanceId = options?.instanceId?.trim() || 'default-memory-engine';
  const defaultConfidence = options?.defaultConfidence ?? DEFAULT_CONFIDENCE;
  assertConfidence(defaultConfidence);
  return new MemoryEngine(instanceId, defaultConfidence);
}

/** Default dev/test singleton. In-memory only. */
export const memoryEngine = createMemoryEngine();
