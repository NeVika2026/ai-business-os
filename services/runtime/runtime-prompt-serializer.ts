import type { PromptRequest } from '@/types/runtime/dto';
import type {
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
  };
}
