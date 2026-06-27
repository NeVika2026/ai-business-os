import type { PromptLimits } from '@/services/runtime/prompt/limits';
import {
  createInjectionBudgetItem,
  selectInjectionBudgetItems,
} from '@/services/runtime/context/injection-budget-selector';
import type {
  CompilePromptInput,
  InjectedContextSelection,
  InjectedKnowledgeChunk,
  InjectedMemoryEntity,
  InjectedMemoryFact,
  InjectedMemoryRelation,
  PromptSectionResult,
} from '@/services/runtime/prompt/types';
import { INJECTED_SECTION_KEYS, INJECTED_SECTION_TITLES } from '@/services/runtime/prompt/types';
import { sanitizeText } from '@/services/runtime/prompt/sanitizer';
import type { KnowledgeChunkRef } from '@/types/runtime/dto';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function readPayloadArray(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isRecord);
}

function normalizeKnowledgeChunk(entry: Record<string, unknown>): InjectedKnowledgeChunk | null {
  const content = typeof entry.content === 'string' ? entry.content.trim() : '';
  if (content.length === 0) {
    return null;
  }

  const chunkId = typeof entry.chunkId === 'string' ? entry.chunkId.trim() : '';
  const sourceTitle =
    typeof entry.sourceTitle === 'string' ? entry.sourceTitle.trim() : 'Unknown source';

  return {
    chunkId: chunkId.length > 0 ? chunkId : null,
    sourceTitle,
    content,
    score: typeof entry.score === 'number' ? entry.score : 0,
  };
}

function normalizeMemoryFact(entry: Record<string, unknown>): InjectedMemoryFact | null {
  const text = typeof entry.text === 'string' ? entry.text.trim() : '';
  if (text.length === 0) {
    return null;
  }

  const factId = typeof entry.factId === 'string' ? entry.factId.trim() : '';

  return {
    factId: factId.length > 0 ? factId : null,
    type: typeof entry.type === 'string' ? entry.type.trim() : 'fact',
    text,
    confidence: typeof entry.confidence === 'number' ? entry.confidence : 0,
    score: typeof entry.score === 'number' ? entry.score : 0,
  };
}

function normalizeMemoryEntity(entry: Record<string, unknown>): InjectedMemoryEntity | null {
  const name = typeof entry.name === 'string' ? entry.name.trim() : '';
  if (name.length === 0) {
    return null;
  }

  const entityId = typeof entry.entityId === 'string' ? entry.entityId.trim() : '';

  return {
    entityId: entityId.length > 0 ? entityId : null,
    name,
    type: typeof entry.type === 'string' ? entry.type.trim() : 'entity',
    aliases: Array.isArray(entry.aliases)
      ? entry.aliases.filter((value): value is string => typeof value === 'string')
      : [],
    score: typeof entry.score === 'number' ? entry.score : 0,
  };
}

function normalizeMemoryRelation(entry: Record<string, unknown>): InjectedMemoryRelation | null {
  const predicate = typeof entry.predicate === 'string' ? entry.predicate.trim() : '';
  const subjectName = typeof entry.subjectName === 'string' ? entry.subjectName.trim() : '';
  const objectName = typeof entry.objectName === 'string' ? entry.objectName.trim() : '';

  if (predicate.length === 0 || subjectName.length === 0 || objectName.length === 0) {
    return null;
  }

  const relationId = typeof entry.relationId === 'string' ? entry.relationId.trim() : '';

  return {
    relationId: relationId.length > 0 ? relationId : null,
    subjectName,
    predicate,
    objectName,
    score: typeof entry.score === 'number' ? entry.score : 0,
  };
}

function fromKnowledgePackageChunk(chunk: KnowledgeChunkRef): InjectedKnowledgeChunk {
  return {
    chunkId: chunk.chunkId,
    sourceTitle: chunk.sourceTitle,
    content: chunk.content,
    score: chunk.score ?? 0,
  };
}

function dedupeKnowledge(chunks: InjectedKnowledgeChunk[]): InjectedKnowledgeChunk[] {
  const seen = new Set<string>();
  const result: InjectedKnowledgeChunk[] = [];

  for (const chunk of chunks) {
    const key = chunk.chunkId ?? chunk.content;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(chunk);
  }

  return result;
}

function dedupeFacts(facts: InjectedMemoryFact[]): InjectedMemoryFact[] {
  const seen = new Set<string>();
  const result: InjectedMemoryFact[] = [];

  for (const fact of facts) {
    const key = fact.factId ?? fact.text;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(fact);
  }

  return result;
}

function dedupeEntities(entities: InjectedMemoryEntity[]): InjectedMemoryEntity[] {
  const seen = new Set<string>();
  const result: InjectedMemoryEntity[] = [];

  for (const entity of entities) {
    const key = entity.entityId ?? entity.name;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(entity);
  }

  return result;
}

function dedupeRelations(relations: InjectedMemoryRelation[]): InjectedMemoryRelation[] {
  const seen = new Set<string>();
  const result: InjectedMemoryRelation[] = [];

  for (const relation of relations) {
    const key =
      relation.relationId ?? `${relation.subjectName}:${relation.predicate}:${relation.objectName}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(relation);
  }

  return result;
}

function knowledgeCharacterCount(chunk: InjectedKnowledgeChunk): number {
  return chunk.sourceTitle.length + chunk.content.length;
}

function entityCharacterCount(entity: InjectedMemoryEntity): number {
  return [entity.name, ...entity.aliases].join(' ').length;
}

function relationCharacterCount(relation: InjectedMemoryRelation): number {
  return `${relation.subjectName} ${relation.predicate} ${relation.objectName}`.length;
}

function applyInjectedLimits(
  knowledge: InjectedKnowledgeChunk[],
  facts: InjectedMemoryFact[],
  entities: InjectedMemoryEntity[],
  relations: InjectedMemoryRelation[],
  limits: PromptLimits,
): InjectedContextSelection {
  const budgetItems = [
    ...knowledge.map((chunk) =>
      createInjectionBudgetItem({
        kind: 'knowledge',
        id: chunk.chunkId,
        fallbackKey: chunk.content,
        score: chunk.score,
        characters: knowledgeCharacterCount(chunk),
        value: chunk,
      }),
    ),
    ...facts.map((fact) =>
      createInjectionBudgetItem({
        kind: 'fact',
        id: fact.factId,
        fallbackKey: fact.text,
        score: fact.score,
        characters: fact.text.length,
        value: fact,
        pinned: fact.type === 'pinned',
      }),
    ),
    ...entities.map((entity) =>
      createInjectionBudgetItem({
        kind: 'entity',
        id: entity.entityId,
        fallbackKey: entity.name,
        score: entity.score,
        characters: entityCharacterCount(entity),
        value: entity,
      }),
    ),
    ...relations.map((relation) =>
      createInjectionBudgetItem({
        kind: 'relation',
        id: relation.relationId,
        fallbackKey: `${relation.subjectName}:${relation.predicate}:${relation.objectName}`,
        score: relation.score,
        characters: relationCharacterCount(relation),
        value: relation,
      }),
    ),
  ];

  const selected = selectInjectionBudgetItems(budgetItems, {
    maxKnowledgeChunks: limits.maxKnowledgeChunks,
    maxMemoryFacts: limits.maxMemoryFacts,
    maxMemoryEntities: limits.maxMemoryEntities,
    maxMemoryRelations: limits.maxMemoryRelations,
    maxCharacters: limits.maxInjectedCharacters,
  });

  return {
    knowledge: selected.knowledge as InjectedKnowledgeChunk[],
    facts: selected.facts as InjectedMemoryFact[],
    entities: selected.entities as InjectedMemoryEntity[],
    relations: selected.relations as InjectedMemoryRelation[],
    truncated: selected.truncated,
    totalCharacters: selected.totalCharacters,
  };
}

export function selectInjectedContext(
  input: CompilePromptInput,
  limits: PromptLimits,
): InjectedContextSelection {
  const payload = input.context.userIntent.payload;
  const payloadKnowledge = readPayloadArray(payload.knowledgeChunks)
    .map(normalizeKnowledgeChunk)
    .filter((chunk): chunk is InjectedKnowledgeChunk => chunk !== null);
  const packageKnowledge = (input.knowledge?.chunks ?? []).map(fromKnowledgePackageChunk);

  const knowledge = dedupeKnowledge([...packageKnowledge, ...payloadKnowledge]);
  const facts = dedupeFacts(
    readPayloadArray(payload.memoryFacts)
      .map(normalizeMemoryFact)
      .filter((fact): fact is InjectedMemoryFact => fact !== null),
  );
  const entities = dedupeEntities(
    readPayloadArray(payload.memoryEntities)
      .map(normalizeMemoryEntity)
      .filter((entity): entity is InjectedMemoryEntity => entity !== null),
  );
  const relations = dedupeRelations(
    readPayloadArray(payload.memoryRelations)
      .map(normalizeMemoryRelation)
      .filter((relation): relation is InjectedMemoryRelation => relation !== null),
  );

  if (
    knowledge.length === 0 &&
    facts.length === 0 &&
    entities.length === 0 &&
    relations.length === 0
  ) {
    return {
      knowledge: [],
      facts: [],
      entities: [],
      relations: [],
      truncated: false,
      totalCharacters: 0,
    };
  }

  return applyInjectedLimits(knowledge, facts, entities, relations, limits);
}

function buildKnowledgeSectionContent(chunks: InjectedKnowledgeChunk[]): string {
  const lines = [INJECTED_SECTION_TITLES.knowledge, ''];

  for (const chunk of chunks) {
    lines.push(
      `- (score ${chunk.score.toFixed(2)}) ${sanitizeText(chunk.sourceTitle)}: ${sanitizeText(chunk.content)}`,
    );
  }

  return lines.join('\n').trim();
}

function buildFactsSectionContent(facts: InjectedMemoryFact[]): string {
  const lines = [INJECTED_SECTION_TITLES.facts, ''];

  for (const fact of facts) {
    lines.push(
      `- [${sanitizeText(fact.type)}] ${sanitizeText(fact.text)} (confidence ${fact.confidence.toFixed(2)})`,
    );
  }

  return lines.join('\n').trim();
}

function buildEntitiesSectionContent(entities: InjectedMemoryEntity[]): string {
  const lines = [INJECTED_SECTION_TITLES.entities, ''];

  for (const entity of entities) {
    const aliasSuffix =
      entity.aliases.length > 0 ? ` aliases: ${entity.aliases.map(sanitizeText).join(', ')}` : '';
    lines.push(`- ${sanitizeText(entity.name)} (${sanitizeText(entity.type)})${aliasSuffix}`);
  }

  return lines.join('\n').trim();
}

function buildRelationsSectionContent(relations: InjectedMemoryRelation[]): string {
  const lines = [INJECTED_SECTION_TITLES.relations, ''];

  for (const relation of relations) {
    lines.push(
      `- ${sanitizeText(relation.subjectName)} ${sanitizeText(relation.predicate)} ${sanitizeText(relation.objectName)}`,
    );
  }

  return lines.join('\n').trim();
}

export function buildInjectedContextSections(
  selection: InjectedContextSelection,
): PromptSectionResult[] {
  const sections: PromptSectionResult[] = [];

  if (selection.knowledge.length > 0) {
    sections.push({
      key: INJECTED_SECTION_KEYS.knowledge,
      role: 'user',
      content: buildKnowledgeSectionContent(selection.knowledge),
    });
  }

  if (selection.facts.length > 0) {
    sections.push({
      key: INJECTED_SECTION_KEYS.facts,
      role: 'user',
      content: buildFactsSectionContent(selection.facts),
    });
  }

  if (selection.entities.length > 0) {
    sections.push({
      key: INJECTED_SECTION_KEYS.entities,
      role: 'user',
      content: buildEntitiesSectionContent(selection.entities),
    });
  }

  if (selection.relations.length > 0) {
    sections.push({
      key: INJECTED_SECTION_KEYS.relations,
      role: 'user',
      content: buildRelationsSectionContent(selection.relations),
    });
  }

  return sections;
}

export function hasInjectedContextPayload(input: CompilePromptInput): boolean {
  const payload = input.context.userIntent.payload;

  return (
    (Array.isArray(input.knowledge?.chunks) && input.knowledge.chunks.length > 0) ||
    (Array.isArray(payload.knowledgeChunks) && payload.knowledgeChunks.length > 0) ||
    (Array.isArray(payload.memoryFacts) && payload.memoryFacts.length > 0) ||
    (Array.isArray(payload.memoryEntities) && payload.memoryEntities.length > 0) ||
    (Array.isArray(payload.memoryRelations) && payload.memoryRelations.length > 0)
  );
}
