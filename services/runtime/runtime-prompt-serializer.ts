import type { PromptRequest } from '@/types/runtime/dto';
import type {
  RuntimePromptInjectedSectionPreview,
  RuntimePromptPreviewResponse,
  RuntimePromptSnapshot,
  SerializedRuntimePromptRequest,
  SerializedRuntimePromptSnapshot,
} from '@/services/runtime/runtime-prompt-types';

export function serializeRuntimePromptSnapshot(
  snapshot: RuntimePromptSnapshot,
): SerializedRuntimePromptSnapshot {
  return {
    lastOperation: snapshot.lastOperation,
    lastRunId: snapshot.lastRunId,
    lastModel: snapshot.lastModel,
    updatedAt: snapshot.updatedAt,
  };
}

export function serializeRuntimePromptRequest(
  request: PromptRequest,
  estimatedTokens: number,
): SerializedRuntimePromptRequest {
  return {
    model: request.model,
    messageCount: request.messages.length,
    toolCount: request.tools?.length ?? 0,
    compilerVersion: request.metadata.compilerVersion,
    estimatedTokens,
  };
}

function serializeInjectedSectionPreview(
  section: RuntimePromptInjectedSectionPreview,
): RuntimePromptInjectedSectionPreview {
  return {
    key: section.key,
    title: section.title,
    itemCount: section.itemCount,
    contentPreview: section.contentPreview,
    contentLength: section.contentLength,
    truncated: section.truncated,
  };
}

export function serializeRuntimePromptPreview(
  preview: RuntimePromptPreviewResponse,
): RuntimePromptPreviewResponse {
  return {
    model: preview.model,
    compilerVersion: preview.compilerVersion,
    messageCount: preview.messageCount,
    estimatedTokens: preview.estimatedTokens,
    toolCount: preview.toolCount,
    roles: [...preview.roles],
    messages: preview.messages.map((message) => ({
      role: message.role,
      contentPreview: message.contentPreview,
      contentLength: message.contentLength,
    })),
    injectedSections: preview.injectedSections.map(serializeInjectedSectionPreview),
  };
}
