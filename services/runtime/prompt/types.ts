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

export const COMPILER_VERSION = '2.0.0';
