import type { ContextPackage, GatewayRequest, PromptMessage } from '@/types/runtime/dto';

import type {
  ReasoningComplexity,
  RouterInput,
  TaskCategory,
  CostTarget,
  LatencyTarget,
} from '@/lib/ai/routing-types';

function estimateContextLength(messages: PromptMessage[]): number {
  return messages.reduce((total, message) => total + message.content.length, 0);
}

function readStringPayload(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readTarget<T extends string>(
  payload: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = readStringPayload(payload, key);

  if (value && allowed.includes(value as T)) {
    return value as T;
  }

  return fallback;
}

export function classifyTaskCategory(intent: string, promptText: string): TaskCategory {
  const haystack = `${intent} ${promptText}`.toLowerCase();

  if (/code|coding|implement|debug|refactor|typescript|python|api endpoint/.test(haystack)) {
    return 'coding';
  }

  if (/find_clients|client acquisition|business strategy|revenue|growth plan|go-to-market/.test(haystack)) {
    return 'business_strategy';
  }

  if (/research|investigate|market scan|competitive|benchmark|sources/.test(haystack)) {
    return 'research';
  }

  if (/write|draft|copy|article|blog|email|newsletter|content/.test(haystack)) {
    return 'writing';
  }

  if (/analy|metrics|report|insight|evaluate|compare data/.test(haystack)) {
    return 'analysis';
  }

  if (/plan|roadmap|milestone|strategy execution|project plan/.test(haystack)) {
    return 'planning';
  }

  if (/summar|tl;dr|brief|condense|recap/.test(haystack)) {
    return 'summarization';
  }

  if (/automate|workflow|integration|trigger|zapier|cron/.test(haystack)) {
    return 'automation';
  }

  if (/support|customer|ticket|reply|help desk|complaint/.test(haystack)) {
    return 'customer_support';
  }

  if (/creative|story|brand voice|campaign idea|concept/.test(haystack)) {
    return 'creative';
  }

  return 'unknown';
}

export function estimateReasoningComplexity(
  intent: string,
  promptText: string,
  toolUsage: boolean,
): ReasoningComplexity {
  const haystack = `${intent} ${promptText}`.toLowerCase();

  if (
    toolUsage ||
    /strategy|architecture|multi-step|tradeoff|priorit|roadmap|analysis|plan/.test(haystack)
  ) {
    return 'high';
  }

  if (/summar|rewrite|format|short|quick|brief/.test(haystack)) {
    return 'low';
  }

  return 'medium';
}

export function buildRouterInputFromGatewayRequest(request: GatewayRequest): RouterInput {
  const routing = request.routing;
  const promptText = request.messages.map((message) => message.content).join('\n');
  const intent = routing?.intent ?? request.providerCode ?? 'unknown';
  const toolUsage = routing?.toolUsage ?? (request.tools?.length ?? 0) > 0;

  return {
    intent,
    taskCategory:
      routing?.taskCategory ??
      classifyTaskCategory(intent, promptText),
    estimatedContextLength:
      routing?.estimatedContextLength ?? estimateContextLength(request.messages),
    reasoningComplexity:
      routing?.reasoningComplexity ??
      estimateReasoningComplexity(intent, promptText, toolUsage),
    latencyTarget: routing?.latencyTarget ?? 'balanced',
    costTarget: routing?.costTarget ?? 'balanced',
    toolUsage,
    organizationId: request.scope.organizationId,
    runId: request.trace.runId,
  };
}

export function buildRoutingHintsFromContext(
  context: ContextPackage,
  messages: PromptMessage[],
  tools?: GatewayRequest['tools'],
): NonNullable<GatewayRequest['routing']> {
  const intent = context.userIntent.action;
  const promptText = messages.map((message) => message.content).join('\n');
  const payload = context.userIntent.payload;
  const toolUsage = (tools?.length ?? 0) > 0;

  return {
    intent,
    taskCategory: classifyTaskCategory(intent, promptText),
    estimatedContextLength: estimateContextLength(messages),
    reasoningComplexity: estimateReasoningComplexity(intent, promptText, toolUsage),
    latencyTarget: readTarget<LatencyTarget>(
      payload,
      'latencyTarget',
      ['fast', 'balanced', 'quality'],
      'balanced',
    ),
    costTarget: readTarget<CostTarget>(payload, 'costTarget', ['low', 'balanced', 'quality'], 'balanced'),
    toolUsage,
  };
}
