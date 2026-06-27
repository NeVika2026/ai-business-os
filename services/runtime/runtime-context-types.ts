import type { BuildContextInput } from '@/services/runtime/context/types';
import type { ContextPackage } from '@/types/runtime/dto';

export type RuntimeContextBuildRequest = BuildContextInput;

export interface RuntimeContextValidationView {
  valid: boolean;
  errors: string[];
}

export interface RuntimeContextPreviewKnowledgeChunk {
  chunkId: string;
  sourceTitle: string;
  contentPreview: string;
  contentLength: number;
}

export interface RuntimeContextPreviewMemoryEntry {
  id: string;
  scope: string;
  contentPreview: string;
  contentLength: number;
}

export interface RuntimeContextPreviewCrmLead {
  id: string;
  name: string;
  status: string;
}

export interface SerializedRuntimeContextPackage {
  organizationId: string;
  projectId: string | null;
  userId: string | null;
  employeeId: string;
  runId: string;
  traceId: string;
  correlationId: string;
  parentRunId: string | null;
  taskId: string | null;
  taskTitle: string | null;
  employeeName: string;
  employeeRoleTitle: string;
  systemPrompt: string | null;
  temperature: number | null;
  maxTokens: number | null;
  topP: number | null;
  providerCode: string;
  modelCode: string;
  contextWindow: number | null;
  supportsTools: boolean;
  userAction: string;
  toolCount: number;
  enabledToolCount: number;
  permissionCount: number;
  knowledgeChunkCount: number;
  memoryEntryCount: number;
  crmLeadCount: number;
  historyMessageCount: number;
  retrievedAt: string;
}

export interface SerializedRuntimeContextPreview {
  organizationId: string;
  employeeId: string;
  runId: string;
  modelCode: string;
  userAction: string;
  knowledgeChunkCount: number;
  memoryEntryCount: number;
  crmLeadCount: number;
  historyMessageCount: number;
  knowledgeChunks: RuntimeContextPreviewKnowledgeChunk[];
  memoryEntries: RuntimeContextPreviewMemoryEntry[];
  crmLeads: RuntimeContextPreviewCrmLead[];
}

export type RuntimeContextOperation = 'build' | 'validate' | 'preview' | null;

export interface RuntimeContextSnapshot {
  lastOperation: RuntimeContextOperation;
  lastRunId: string | null;
  lastModelCode: string | null;
  lastEmployeeId: string | null;
  updatedAt: string;
}

export interface SerializedRuntimeContextSnapshot {
  lastOperation: RuntimeContextOperation;
  lastRunId: string | null;
  lastModelCode: string | null;
  lastEmployeeId: string | null;
  updatedAt: string;
}

export interface RuntimeContextDependencies {
  build: (request: BuildContextInput) => ContextPackage;
}

export interface RuntimeContextAdapterOptions {
  dependencies?: Partial<RuntimeContextDependencies>;
}

export const RUNTIME_CONTEXT_PREVIEW_MAX_CHARS = 160;

export type { BuildContextInput, ContextPackage };
