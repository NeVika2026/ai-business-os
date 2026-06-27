import { MemoryExtractorValidationError } from '@/services/memory/memory-extractor-errors';
import { serializeMemoryExtractorSnapshot } from '@/services/memory/memory-extractor-serializer';
import type {
  ExtractedEntity,
  ExtractedFact,
  ExtractedRelation,
  ExtractorConfidenceLevel,
  ExtractorFactType,
  MemoryEntityType,
  MemoryExtractionResult,
  MemoryExtractorInput,
  MemoryExtractorOptions,
  MemoryExtractorSnapshot,
  SerializedMemoryExtractorSnapshot,
} from '@/services/memory/memory-extractor-types';

const CONFIDENCE_BY_LEVEL: Record<ExtractorConfidenceLevel, number> = {
  explicit: 1,
  strong: 0.9,
  weak: 0.7,
};

interface KnownEntityDefinition {
  canonicalName: string;
  aliases: string[];
  type: MemoryEntityType;
}

interface FactPatternDefinition {
  type: ExtractorFactType;
  pattern: string;
  regex: RegExp;
  confidenceLevel: ExtractorConfidenceLevel;
  buildText: (match: RegExpMatchArray, sentence: string) => string;
}

interface RelationPatternDefinition {
  predicate: string;
  pattern: string;
  regex: RegExp;
  confidenceLevel: ExtractorConfidenceLevel;
}

const KNOWN_ENTITIES: KnownEntityDefinition[] = [
  {
    canonicalName: 'Victoria',
    aliases: ['Victoria', 'Viktoria', 'Виктория', 'Вика'],
    type: 'person',
  },
  {
    canonicalName: 'FAMALL',
    aliases: ['FAMALL'],
    type: 'company',
  },
  {
    canonicalName: 'AI Business OS',
    aliases: ['AI Business OS'],
    type: 'project',
  },
  {
    canonicalName: 'Cursor',
    aliases: ['Cursor'],
    type: 'generic',
  },
  {
    canonicalName: 'Supabase',
    aliases: ['Supabase'],
    type: 'organization',
  },
  {
    canonicalName: 'Telegram',
    aliases: ['Telegram'],
    type: 'organization',
  },
  {
    canonicalName: 'Claude',
    aliases: ['Claude'],
    type: 'generic',
  },
  {
    canonicalName: 'OpenAI',
    aliases: ['OpenAI'],
    type: 'organization',
  },
];

const FACT_PATTERNS: FactPatternDefinition[] = [
  {
    type: 'user_fact',
    pattern: 'name_intro_ru',
    regex: /(?:меня зовут|мое имя|моё имя)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'explicit',
    buildText: (match) => `User name is ${cleanupCapture(match[1])}`,
  },
  {
    type: 'user_fact',
    pattern: 'name_intro_en',
    regex: /(?:my name is|i am called|call me)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'explicit',
    buildText: (match) => `User name is ${cleanupCapture(match[1])}`,
  },
  {
    type: 'business_fact',
    pattern: 'work_ru',
    regex: /(?:я работаю(?:\s+в|\s+на|\s+с)?|работаю в|работаю на)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (match, sentence) =>
      cleanupSentence(sentence) || `Works at ${cleanupCapture(match[1])}`,
  },
  {
    type: 'business_fact',
    pattern: 'work_en',
    regex: /(?:i work at|i work for|i work on|i work with)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (match, sentence) =>
      cleanupSentence(sentence) || `Works at ${cleanupCapture(match[1])}`,
  },
  {
    type: 'project_fact',
    pattern: 'project_ru',
    regex: /(?:мой проект|наш проект|проект)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'project_fact',
    pattern: 'project_en',
    regex: /(?:my project|our project|the project)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'preference',
    pattern: 'preference_ru',
    regex: /(?:мне нравится|я предпочитаю|я люблю)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'preference',
    pattern: 'preference_en',
    regex: /(?:i like|i prefer|i love)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'goal',
    pattern: 'goal_ru',
    regex: /(?:я хочу|моя цель|цель)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'goal',
    pattern: 'goal_en',
    regex: /(?:i want to|i want|my goal is|goal)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'decision',
    pattern: 'decision_ru',
    regex: /(?:мы решили|я решил|я решила|решили)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'decision',
    pattern: 'decision_en',
    regex: /(?:we decided|i decided|decision)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'company',
    pattern: 'company_ru',
    regex: /(?:компания|компании)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'weak',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'company',
    pattern: 'company_en',
    regex: /(?:company|the company)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'weak',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'client',
    pattern: 'client_ru',
    regex: /(?:клиент|клиента|клиенты)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'client',
    pattern: 'client_en',
    regex: /(?:client|the client)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'lead',
    pattern: 'lead_ru',
    regex: /(?:лид|лида|лиды)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'lead',
    pattern: 'lead_en',
    regex: /(?:lead|the lead)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'strong',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'contact',
    pattern: 'contact_ru',
    regex: /(?:контакт|контакта|контакты)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'weak',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'contact',
    pattern: 'contact_en',
    regex: /(?:contact|the contact)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'weak',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'document',
    pattern: 'document_ru',
    regex: /(?:документ|документа|документы)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'weak',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'document',
    pattern: 'document_en',
    regex: /(?:document|the document)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'weak',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'task',
    pattern: 'task_ru',
    regex: /(?:задача|задачи)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'weak',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'task',
    pattern: 'task_en',
    regex: /(?:task|the task)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'weak',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'event',
    pattern: 'event_ru',
    regex: /(?:событие|события|мероприятие)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'weak',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
  {
    type: 'event',
    pattern: 'event_en',
    regex: /(?:event|the event)\s+([^.!?\n]+)/iu,
    confidenceLevel: 'weak',
    buildText: (_match, sentence) => cleanupSentence(sentence),
  },
];

const RELATION_PATTERNS: RelationPatternDefinition[] = [
  {
    predicate: 'works_on',
    pattern: 'works_on_ru',
    regex: /(.+?)\s+(?:работает над|работаю над|работает с проектом)\s+(.+?)(?:[.!?]|$)/iu,
    confidenceLevel: 'strong',
  },
  {
    predicate: 'works_on',
    pattern: 'works_on_en',
    regex: /(.+?)\s+(?:works on|working on|work on)\s+(.+?)(?:[.!?]|$)/iu,
    confidenceLevel: 'strong',
  },
  {
    predicate: 'uses',
    pattern: 'uses_ru',
    regex: /(.+?)\s+(?:использует|используем|использую)\s+(.+?)(?:[.!?]|$)/iu,
    confidenceLevel: 'strong',
  },
  {
    predicate: 'uses',
    pattern: 'uses_en',
    regex: /(.+?)\s+(?:uses|using|use)\s+(.+?)(?:[.!?]|$)/iu,
    confidenceLevel: 'strong',
  },
  {
    predicate: 'promotes',
    pattern: 'promotes_ru',
    regex: /(.+?)\s+(?:продвигает|продвигаю|продвигаем)\s+(.+?)(?:[.!?]|$)/iu,
    confidenceLevel: 'strong',
  },
  {
    predicate: 'promotes',
    pattern: 'promotes_en',
    regex: /(.+?)\s+(?:promotes|promoting|promote)\s+(.+?)(?:[.!?]|$)/iu,
    confidenceLevel: 'strong',
  },
];

const DEFAULT_RELATIONS: Array<{
  subject: string;
  predicate: string;
  object: string;
  confidenceLevel: ExtractorConfidenceLevel;
  pattern: string;
}> = [
  {
    subject: 'Victoria',
    predicate: 'works_on',
    object: 'AI Business OS',
    confidenceLevel: 'explicit',
    pattern: 'known_relation_victoria_works_on_ai_business_os',
  },
  {
    subject: 'AI Business OS',
    predicate: 'uses',
    object: 'Supabase',
    confidenceLevel: 'explicit',
    pattern: 'known_relation_ai_business_os_uses_supabase',
  },
  {
    subject: 'Victoria',
    predicate: 'promotes',
    object: 'FAMALL',
    confidenceLevel: 'explicit',
    pattern: 'known_relation_victoria_promotes_famall',
  },
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cleanupCapture(value: string): string {
  return value.trim().replace(/^["'«]|["'»]$/g, '');
}

function cleanupSentence(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeText(value: string): string {
  return cleanupSentence(value).toLowerCase();
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function splitSentences(text: string): string[] {
  return text
    .split(/[\n.!?;]+/)
    .map((sentence) => cleanupSentence(sentence))
    .filter((sentence) => sentence.length > 0);
}

function createFactKey(type: ExtractorFactType, text: string): string {
  return `${type}:${normalizeText(text)}`;
}

function createRelationKey(subject: string, predicate: string, object: string): string {
  return `${normalizeName(subject)}:${predicate}:${normalizeName(object)}`;
}

function createEntityKey(name: string): string {
  return normalizeName(name);
}

function resolveKnownEntity(name: string): KnownEntityDefinition | null {
  const normalized = normalizeName(name);

  for (const entity of KNOWN_ENTITIES) {
    if (entity.aliases.some((alias) => normalizeName(alias) === normalized)) {
      return entity;
    }
  }

  return null;
}

function resolveEntityName(name: string): string {
  return resolveKnownEntity(name)?.canonicalName ?? cleanupCapture(name);
}

function validateInput(input: MemoryExtractorInput): MemoryExtractorInput {
  if (!input || typeof input !== 'object') {
    throw new MemoryExtractorValidationError('input must be an object');
  }

  if (!isNonEmptyString(input.text)) {
    throw new MemoryExtractorValidationError('input text is required');
  }

  return {
    text: cleanupSentence(input.text),
    source: input.source?.trim() || 'memory-extractor',
    metadata: { ...(input.metadata ?? {}) },
  };
}

/**
 * Rule-based deterministic memory extractor.
 */
export class MemoryExtractor {
  private lastInput: string | null = null;
  private lastExtractedAt: string | null = null;
  private lastResult: MemoryExtractionResult | null = null;
  private extractionCount = 0;
  private updatedAt = nowIso();

  constructor(private readonly instanceId: string) {}

  extract(input: MemoryExtractorInput): MemoryExtractionResult {
    const normalized = validateInput(input);
    const result = this.buildExtraction(normalized);
    this.lastInput = normalized.text;
    this.lastExtractedAt = nowIso();
    this.lastResult = result;
    this.extractionCount += 1;
    this.updatedAt = this.lastExtractedAt;
    return result;
  }

  extractFacts(input: MemoryExtractorInput): ExtractedFact[] {
    return this.buildExtraction(validateInput(input)).facts;
  }

  extractEntities(input: MemoryExtractorInput): ExtractedEntity[] {
    return this.buildExtraction(validateInput(input)).entities;
  }

  extractRelations(input: MemoryExtractorInput): ExtractedRelation[] {
    return this.buildExtraction(validateInput(input)).relations;
  }

  preview(input: MemoryExtractorInput): MemoryExtractionResult {
    return this.buildExtraction(validateInput(input));
  }

  serialize(): SerializedMemoryExtractorSnapshot {
    return serializeMemoryExtractorSnapshot({
      snapshot: this.buildSnapshot(),
      lastResult: this.lastResult,
    });
  }

  reset(): void {
    this.lastInput = null;
    this.lastExtractedAt = null;
    this.lastResult = null;
    this.extractionCount = 0;
    this.updatedAt = nowIso();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private buildExtraction(input: MemoryExtractorInput): MemoryExtractionResult {
    const sentences = splitSentences(input.text);
    const factResult = this.extractFactsFromSentences(sentences, input);
    const entities = this.extractEntitiesFromText(input.text, input, factResult.facts);
    const relations = this.extractRelationsFromText(input.text, input, entities);

    return {
      input: input.text,
      facts: factResult.facts,
      entities,
      relations,
      statistics: {
        factCount: factResult.facts.length,
        entityCount: entities.length,
        relationCount: relations.length,
        duplicatesSkipped: factResult.duplicatesSkipped,
        sentencesProcessed: sentences.length,
      },
    };
  }

  private extractFactsFromSentences(
    sentences: string[],
    input: MemoryExtractorInput,
  ): { facts: ExtractedFact[]; duplicatesSkipped: number } {
    const facts: ExtractedFact[] = [];
    const seen = new Set<string>();
    let duplicatesSkipped = 0;

    for (const sentence of sentences) {
      for (const pattern of FACT_PATTERNS) {
        const match = sentence.match(pattern.regex);
        if (!match) {
          continue;
        }

        const text = cleanupSentence(pattern.buildText(match, sentence));
        if (!isNonEmptyString(text)) {
          continue;
        }

        const key = createFactKey(pattern.type, text);
        if (seen.has(key)) {
          duplicatesSkipped += 1;
          continue;
        }

        seen.add(key);
        facts.push({
          type: pattern.type,
          text,
          confidence: CONFIDENCE_BY_LEVEL[pattern.confidenceLevel],
          confidenceLevel: pattern.confidenceLevel,
          pattern: pattern.pattern,
          source: input.source ?? 'memory-extractor',
          metadata: {
            sentence,
            ...input.metadata,
          },
        });
        break;
      }
    }

    return { facts, duplicatesSkipped };
  }

  private extractEntitiesFromText(
    text: string,
    input: MemoryExtractorInput,
    facts: ExtractedFact[],
  ): ExtractedEntity[] {
    const entityMap = new Map<string, ExtractedEntity>();

    for (const known of KNOWN_ENTITIES) {
      for (const alias of known.aliases) {
        const regex = new RegExp(
          `(?:^|[^\\p{L}\\p{N}])(${escapeRegex(alias)})(?:[^\\p{L}\\p{N}]|$)`,
          'iu',
        );
        if (!regex.test(text)) {
          continue;
        }

        this.upsertEntity(entityMap, {
          name: known.canonicalName,
          type: known.type,
          aliases: known.aliases.filter((value) => value !== known.canonicalName),
          confidence: 1,
          source: input.source ?? 'memory-extractor',
          metadata: {
            matchedAlias: alias,
            ...input.metadata,
          },
        });
        break;
      }
    }

    for (const fact of facts) {
      if (fact.type !== 'user_fact') {
        continue;
      }

      const nameMatch =
        fact.text.match(/User name is\s+(.+)/i) ??
        fact.text.match(/(?:имя|name)\s+(?:is|:)\s+(.+)/i);

      if (!nameMatch) {
        continue;
      }

      const rawName = cleanupCapture(nameMatch[1]);
      const known = resolveKnownEntity(rawName);
      this.upsertEntity(entityMap, {
        name: known?.canonicalName ?? rawName,
        type: known?.type ?? 'person',
        aliases:
          known?.aliases.filter((value) => value !== (known?.canonicalName ?? rawName)) ?? [],
        confidence: fact.confidence,
        source: input.source ?? 'memory-extractor',
        metadata: {
          extractedFromFact: fact.text,
          ...input.metadata,
        },
      });
    }

    return [...entityMap.values()].sort((left, right) => left.name.localeCompare(right.name));
  }

  private extractRelationsFromText(
    text: string,
    input: MemoryExtractorInput,
    entities: ExtractedEntity[],
  ): ExtractedRelation[] {
    const relations: ExtractedRelation[] = [];
    const seen = new Set<string>();
    const sentences = splitSentences(text);
    const entityNames = new Set(entities.map((entity) => normalizeName(entity.name)));

    for (const sentence of sentences) {
      for (const pattern of RELATION_PATTERNS) {
        const match = sentence.match(pattern.regex);
        if (!match) {
          continue;
        }

        const subject = resolveEntityName(cleanupCapture(match[1]));
        const object = resolveEntityName(cleanupCapture(match[2]));
        this.pushRelation(relations, seen, {
          subject,
          predicate: pattern.predicate,
          object,
          confidence: CONFIDENCE_BY_LEVEL[pattern.confidenceLevel],
          confidenceLevel: pattern.confidenceLevel,
          pattern: pattern.pattern,
          source: input.source ?? 'memory-extractor',
          metadata: {
            sentence,
            ...input.metadata,
          },
        });
      }
    }

    for (const knownRelation of DEFAULT_RELATIONS) {
      const subjectPresent =
        entityNames.has(normalizeName(knownRelation.subject)) ||
        textIncludesEntity(text, knownRelation.subject);
      const objectPresent =
        entityNames.has(normalizeName(knownRelation.object)) ||
        textIncludesEntity(text, knownRelation.object);

      if (!subjectPresent || !objectPresent) {
        continue;
      }

      const subject = resolveEntityName(knownRelation.subject);
      const object = resolveEntityName(knownRelation.object);
      const predicateMentioned = sentenceMentionsRelation(text, knownRelation.predicate);

      if (!predicateMentioned && !sentenceMentionsBothEntities(text, subject, object)) {
        continue;
      }

      this.pushRelation(relations, seen, {
        subject,
        predicate: knownRelation.predicate,
        object,
        confidence: CONFIDENCE_BY_LEVEL[knownRelation.confidenceLevel],
        confidenceLevel: knownRelation.confidenceLevel,
        pattern: knownRelation.pattern,
        source: input.source ?? 'memory-extractor',
        metadata: {
          inferred: true,
          ...input.metadata,
        },
      });
    }

    return relations.sort((left, right) =>
      `${left.subject}:${left.predicate}:${left.object}`.localeCompare(
        `${right.subject}:${right.predicate}:${right.object}`,
      ),
    );
  }

  private pushRelation(
    relations: ExtractedRelation[],
    seen: Set<string>,
    relation: ExtractedRelation,
  ): void {
    const key = createRelationKey(relation.subject, relation.predicate, relation.object);
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    relations.push(relation);
  }

  private upsertEntity(entityMap: Map<string, ExtractedEntity>, entity: ExtractedEntity): void {
    const key = createEntityKey(entity.name);
    const existing = entityMap.get(key);

    if (!existing) {
      entityMap.set(key, {
        ...entity,
        aliases: [...new Set(entity.aliases)],
      });
      return;
    }

    existing.aliases = [...new Set([...existing.aliases, ...entity.aliases])];
    existing.confidence = Math.max(existing.confidence, entity.confidence);
    existing.metadata = {
      ...existing.metadata,
      ...entity.metadata,
    };
  }

  private buildSnapshot(): MemoryExtractorSnapshot {
    return {
      instanceId: this.instanceId,
      lastInput: this.lastInput,
      lastExtractedAt: this.lastExtractedAt,
      extractionCount: this.extractionCount,
      statistics: this.lastResult?.statistics ?? {
        factCount: 0,
        entityCount: 0,
        relationCount: 0,
        duplicatesSkipped: 0,
        sentencesProcessed: 0,
      },
      updatedAt: this.updatedAt,
    };
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function textIncludesEntity(text: string, entityName: string): boolean {
  const known = resolveKnownEntity(entityName);
  const names = known ? known.aliases : [entityName];

  return names.some((name) => {
    const regex = new RegExp(
      `(?:^|[^\\p{L}\\p{N}])${escapeRegex(name)}(?:[^\\p{L}\\p{N}]|$)`,
      'iu',
    );
    return regex.test(text);
  });
}

function sentenceMentionsRelation(text: string, predicate: string): boolean {
  const keywords: Record<string, string[]> = {
    works_on: ['работает над', 'works on', 'working on', 'work on'],
    uses: ['использует', 'uses', 'using', 'use'],
    promotes: ['продвигает', 'promotes', 'promoting', 'promote'],
  };

  const phrases = keywords[predicate] ?? [];
  const lower = text.toLowerCase();
  return phrases.some((phrase) => lower.includes(phrase));
}

function sentenceMentionsBothEntities(text: string, subject: string, object: string): boolean {
  return textIncludesEntity(text, subject) && textIncludesEntity(text, object);
}

export function createMemoryExtractor(options?: MemoryExtractorOptions): MemoryExtractor {
  const instanceId = options?.instanceId?.trim() || 'default-memory-extractor';
  return new MemoryExtractor(instanceId);
}

/** Default dev/test singleton. Rule-based memory extraction only. */
export const memoryExtractor = createMemoryExtractor();
