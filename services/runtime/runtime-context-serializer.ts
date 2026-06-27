import type { ContextPackage } from '@/types/runtime/dto';
import type {
  RuntimeContextPreviewCrmLead,
  RuntimeContextPreviewKnowledgeChunk,
  RuntimeContextPreviewMemoryEntry,
  RuntimeContextSnapshot,
  SerializedRuntimeContextPackage,
  SerializedRuntimeContextPreview,
  SerializedRuntimeContextSnapshot,
} from '@/services/runtime/runtime-context-types';
import { RUNTIME_CONTEXT_PREVIEW_MAX_CHARS } from '@/services/runtime/runtime-context-types';

function truncatePreview(content: string, maxChars: number): string {
  if (content.length <= maxChars) {
    return content;
  }

  return `${content.slice(0, maxChars)}…`;
}

function countPayloadArray(payload: Record<string, unknown>, key: string): number {
  const value = payload[key];
  return Array.isArray(value) ? value.length : 0;
}

export function serializeRuntimeContextPackage(
  context: ContextPackage,
): SerializedRuntimeContextPackage {
  const payload = context.userIntent.payload;
  const enabledToolCount = context.employee.tools.filter((tool) => tool.enabled).length;

  return {
    organizationId: context.scope.organizationId,
    projectId: context.scope.projectId ?? null,
    userId: context.scope.userId ?? null,
    employeeId: context.employee.id,
    runId: context.trace.runId,
    traceId: context.trace.traceId,
    correlationId: context.trace.correlationId,
    parentRunId: context.trace.parentRunId ?? null,
    taskId: context.task?.id ?? null,
    taskTitle: context.task?.title ?? null,
    employeeName: context.employee.name,
    employeeRoleTitle: context.employee.roleTitle,
    systemPrompt: context.employee.systemPrompt ?? null,
    temperature: context.employee.configuration.temperature ?? null,
    maxTokens: context.employee.configuration.maxTokens ?? null,
    topP: context.employee.configuration.topP ?? null,
    providerCode: context.provider.code,
    modelCode: context.model.code,
    contextWindow: context.model.contextWindow ?? null,
    supportsTools: context.model.supportsTools,
    userAction: context.userIntent.action,
    toolCount: context.employee.tools.length,
    enabledToolCount,
    permissionCount: Object.keys(context.employee.permissions).length,
    knowledgeChunkCount: countPayloadArray(payload, 'knowledgeChunks'),
    memoryEntryCount: countPayloadArray(payload, 'memoryEntries'),
    crmLeadCount: countPayloadArray(payload, 'crmLeads'),
    historyMessageCount: countPayloadArray(payload, 'history'),
    retrievedAt: context.retrievedAt,
  };
}

function toKnowledgeChunkPreviews(
  payload: Record<string, unknown>,
): RuntimeContextPreviewKnowledgeChunk[] {
  const chunks = payload.knowledgeChunks;
  if (!Array.isArray(chunks)) {
    return [];
  }

  return chunks.map((chunk) => {
    const record = chunk as Record<string, unknown>;
    const content = typeof record.content === 'string' ? record.content : '';

    return {
      chunkId: typeof record.chunkId === 'string' ? record.chunkId : '',
      sourceTitle: typeof record.sourceTitle === 'string' ? record.sourceTitle : '',
      contentPreview: truncatePreview(content, RUNTIME_CONTEXT_PREVIEW_MAX_CHARS),
      contentLength: content.length,
    };
  });
}

function toMemoryEntryPreviews(
  payload: Record<string, unknown>,
): RuntimeContextPreviewMemoryEntry[] {
  const entries = payload.memoryEntries;
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map((entry) => {
    const record = entry as Record<string, unknown>;
    const content = typeof record.content === 'string' ? record.content : '';

    return {
      id: typeof record.id === 'string' ? record.id : '',
      scope: typeof record.scope === 'string' ? record.scope : '',
      contentPreview: truncatePreview(content, RUNTIME_CONTEXT_PREVIEW_MAX_CHARS),
      contentLength: content.length,
    };
  });
}

function toCrmLeadPreviews(payload: Record<string, unknown>): RuntimeContextPreviewCrmLead[] {
  const leads = payload.crmLeads;
  if (!Array.isArray(leads)) {
    return [];
  }

  return leads.map((lead) => {
    const record = lead as Record<string, unknown>;

    return {
      id: typeof record.id === 'string' ? record.id : '',
      name: typeof record.name === 'string' ? record.name : '',
      status: typeof record.status === 'string' ? record.status : '',
    };
  });
}

export function serializeRuntimeContextPreview(
  context: ContextPackage,
): SerializedRuntimeContextPreview {
  const payload = context.userIntent.payload;

  return {
    organizationId: context.scope.organizationId,
    employeeId: context.employee.id,
    runId: context.trace.runId,
    modelCode: context.model.code,
    userAction: context.userIntent.action,
    knowledgeChunkCount: countPayloadArray(payload, 'knowledgeChunks'),
    memoryEntryCount: countPayloadArray(payload, 'memoryEntries'),
    crmLeadCount: countPayloadArray(payload, 'crmLeads'),
    historyMessageCount: countPayloadArray(payload, 'history'),
    knowledgeChunks: toKnowledgeChunkPreviews(payload),
    memoryEntries: toMemoryEntryPreviews(payload),
    crmLeads: toCrmLeadPreviews(payload),
  };
}

export function serializeRuntimeContextSnapshot(
  snapshot: RuntimeContextSnapshot,
): SerializedRuntimeContextSnapshot {
  return {
    lastOperation: snapshot.lastOperation,
    lastRunId: snapshot.lastRunId,
    lastModelCode: snapshot.lastModelCode,
    lastEmployeeId: snapshot.lastEmployeeId,
    updatedAt: snapshot.updatedAt,
  };
}
