import type { ISODateTime, TenantScope, TraceContext, UUID } from '@/types/runtime/dto';

export const MOCK_RETRIEVED_AT: ISODateTime = '2026-01-01T00:00:00.000Z';

export interface BuildContextInput {
  scope: TenantScope;
  trace: TraceContext;
  employeeId: UUID;
  request: {
    action: string;
    payload: Record<string, unknown>;
  };
  taskId?: UUID | null;
  retrievedAt?: ISODateTime;
}

export interface OrganizationContext {
  id: UUID;
  name: string;
  timezone: string;
  locale: string;
}

export interface EmployeeProviderResult {
  id: UUID;
  name: string;
  roleTitle: string;
  systemPrompt: string | null;
  configuration: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  tools: Array<{ id: string; enabled: boolean }>;
  permissions: Record<string, boolean>;
  provider: {
    id: UUID;
    code: string;
  };
  model: {
    id: UUID;
    code: string;
    contextWindow: number | null;
    supportsTools: boolean;
  };
}

export interface KnowledgeItemRef {
  id: UUID;
  title: string;
  type: string;
}

export interface KnowledgeProviderResult {
  items: KnowledgeItemRef[];
  chunks: Array<{
    chunkId: UUID;
    itemId: UUID;
    sourceId: UUID;
    sourceTitle: string;
    content: string;
  }>;
}

export interface MemoryProviderResult {
  semantic: Array<{
    id: UUID;
    scope: string;
    content: string;
    importance: number;
  }>;
  working: Array<{
    id: UUID;
    scope: string;
    content: string;
    importance: number;
  }>;
}

export interface CrmProviderResult {
  leads: Array<{
    id: UUID;
    name: string;
    status: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  }>;
  customers: Array<{
    id: UUID;
    name: string;
  }>;
  notes: string[];
}

export interface UserProviderResult {
  request: {
    action: string;
    payload: Record<string, unknown>;
  };
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface BuiltContextArtifacts {
  organization: OrganizationContext;
  knowledgeChunks: KnowledgeProviderResult['chunks'];
  memoryEntries: MemoryProviderResult['semantic'];
  crmLeads: CrmProviderResult['leads'];
}
