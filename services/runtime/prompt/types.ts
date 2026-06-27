import type {
  ContextPackage,
  KnowledgePackage,
  MemoryPackage,
  PromptMessage,
} from '@/types/runtime/dto';

export type PromptTemplateId = 'default' | 'assistant' | 'sales' | 'support' | 'analyst';

export interface CrmSectionItem {
  id: string;
  name: string;
  status?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface CompilePromptInput {
  context: ContextPackage;
  knowledge?: KnowledgePackage | null;
  memory?: MemoryPackage | null;
  crmItems?: CrmSectionItem[];
  templateId?: PromptTemplateId;
  conversationHistory?: PromptMessage[];
}

export interface PromptSectionResult {
  key: string;
  role: 'system' | 'user';
  content: string;
}

export interface InjectedKnowledgeChunk {
  chunkId: string | null;
  sourceTitle: string;
  content: string;
  score: number;
}

export interface InjectedMemoryFact {
  factId: string | null;
  type: string;
  text: string;
  confidence: number;
  score: number;
}

export interface InjectedMemoryEntity {
  entityId: string | null;
  name: string;
  type: string;
  aliases: string[];
  score: number;
}

export interface InjectedMemoryRelation {
  relationId: string | null;
  subjectName: string;
  predicate: string;
  objectName: string;
  score: number;
}

export interface InjectedContextSelection {
  knowledge: InjectedKnowledgeChunk[];
  facts: InjectedMemoryFact[];
  entities: InjectedMemoryEntity[];
  relations: InjectedMemoryRelation[];
  truncated: boolean;
  totalCharacters: number;
}

export const INJECTED_SECTION_KEYS = {
  knowledge: 'relevant-knowledge',
  facts: 'relevant-memory-facts',
  entities: 'relevant-memory-entities',
  relations: 'relevant-memory-relations',
} as const;

export const INJECTED_SECTION_TITLES = {
  knowledge: 'Relevant Knowledge',
  facts: 'Relevant Memory Facts',
  entities: 'Relevant Memory Entities',
  relations: 'Relevant Memory Relations',
} as const;

export const COMPILER_VERSION = '2.1.0';
