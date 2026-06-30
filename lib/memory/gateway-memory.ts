import { captureGatewayMemory } from '@/lib/memory/memory-engine';
import type { GatewayRequest, GatewayResponse, PromptMessage } from '@/types/runtime/dto';
import type { MemoryEntry } from '@/types/memory';

import { buildGatewayMemoryContext } from './context-builder';

const MEMORY_CONTEXT_MARKER = 'Continue from previous work.';

function isMemoryContextMessage(message: PromptMessage): boolean {
  return message.role === 'system' && message.content.includes(MEMORY_CONTEXT_MARKER);
}

function extractUserTask(messages: PromptMessage[]): string | null {
  const userMessages = messages.filter((message) => message.role === 'user');

  if (userMessages.length === 0) {
    return null;
  }

  const content = userMessages[userMessages.length - 1]?.content.trim();
  return content || null;
}

export function applyGatewayMemoryInjection(request: GatewayRequest): GatewayRequest {
  if (request.messages.some(isMemoryContextMessage)) {
    return request;
  }

  const context = buildGatewayMemoryContext({
    organizationId: request.scope.organizationId,
    userId: request.scope.userId,
    projectId: request.scope.projectId,
  });

  if (!context.hasMemory) {
    return request;
  }

  return {
    ...request,
    messages: [{ role: 'system', content: context.content }, ...request.messages],
  };
}

export function captureGatewayMemoryFromResponse(
  request: GatewayRequest,
  response: GatewayResponse,
): MemoryEntry | null {
  const result = response.content?.trim();

  if (!result) {
    return null;
  }

  const task = extractUserTask(request.messages);

  if (!task) {
    return null;
  }

  return captureGatewayMemory({
    task,
    result,
    intent: request.routing?.intent ?? 'gateway_run',
    routingCategory: request.routing?.taskCategory ?? 'unknown',
    organizationId: request.scope.organizationId,
    userId: request.scope.userId,
    sessionId: null,
    projectId: request.scope.projectId ?? null,
    runId: request.trace.runId,
    correlationId: request.trace.correlationId,
    occurredAt: new Date().toISOString(),
  });
}
