import { FUGU_PROVIDER_CODE } from '@/lib/ai/providers/fugu';
import { buildRouterInputFromGatewayRequest } from '@/lib/ai/routing-context';
import { loadRoutingTableFromEnv, mergeRoutes } from '@/lib/ai/routing-config';
import type { ProviderRoute, RoutingPlan } from '@/lib/ai/routing-types';
import { estimateRouterCost, recordRouterMetric } from '@/lib/ai/router-metrics';
import { filterAvailableRoutes, rankProviderRoutes } from '@/lib/ai/router-scoring';
import { recordRouterOutcome } from '@/lib/ai/router-stats';
import { isRetryableProviderError } from '@/services/runtime/gateway/provider-errors';
import {
  InvalidGatewayRequestError,
  ModelNotSupportedError,
  ProviderUnavailableError,
} from '@/services/runtime/gateway/errors';
import type { ProviderCode, StreamChunk } from '@/services/runtime/gateway/types';
import type { GatewayRequest as GatewayRequestDto, GatewayResponse } from '@/types/runtime/dto';

export type { ProviderRoute } from '@/lib/ai/routing-types';

loadRoutingTableFromEnv();

const LEGACY_FUGU_FALLBACKS: ProviderRoute[] = [
  { providerCode: 'anthropic', modelCode: 'claude-haiku-4' },
  { providerCode: 'openai', modelCode: 'gpt-4o-mini' },
];

export class ExecutionUnavailableError extends Error {
  constructor() {
    super('Unable to complete your request at this time.');
    this.name = 'ExecutionUnavailableError';
  }
}

function usesIntelligentRouting(request: GatewayRequestDto): boolean {
  return request.providerCode === 'auto' || Boolean(request.routing);
}

export function resolveRoutingPlan(request: GatewayRequestDto): RoutingPlan {
  if (!usesIntelligentRouting(request)) {
    const routes = buildLegacyProviderRoutes(request);
    const input = buildRouterInputFromGatewayRequest(request);

    return {
      input,
      profile: input.taskCategory,
      routes,
    };
  }

  const input = buildRouterInputFromGatewayRequest(request);
  return rankProviderRoutes(input);
}

export function buildProviderRoutes(request: GatewayRequestDto): ProviderRoute[] {
  return resolveRoutingPlan(request).routes;
}

function buildLegacyProviderRoutes(request: GatewayRequestDto): ProviderRoute[] {
  const primary: ProviderRoute = {
    providerCode: request.providerCode as ProviderCode,
    modelCode: request.modelCode,
  };

  if (primary.providerCode !== FUGU_PROVIDER_CODE) {
    return [primary];
  }

  return filterAvailableRoutes(mergeRoutes([primary], LEGACY_FUGU_FALLBACKS));
}

function isFallbackEligibleError(error: unknown): boolean {
  if (error instanceof InvalidGatewayRequestError) {
    return false;
  }

  if (error instanceof ProviderUnavailableError) {
    return true;
  }

  if (error instanceof ModelNotSupportedError) {
    return true;
  }

  if (isRetryableProviderError(error)) {
    return true;
  }

  return error instanceof Error;
}

function recordSuccessfulRoute(input: {
  request: GatewayRequestDto;
  plan: RoutingPlan;
  route: ProviderRoute;
  routeIndex: number;
  response: GatewayResponse;
}): void {
  const estimatedCost = estimateRouterCost(
    input.route.providerCode,
    input.route.modelCode,
    input.response.usage.inputTokens,
    input.response.usage.outputTokens,
  );

  recordRouterMetric({
    runId: input.request.trace.runId,
    organizationId: input.request.scope.organizationId,
    taskCategory: input.plan.input.taskCategory,
    profile: input.plan.profile,
    provider: input.route.providerCode,
    model: input.route.modelCode,
    latencyMs: input.response.latencyMs,
    inputTokens: input.response.usage.inputTokens,
    outputTokens: input.response.usage.outputTokens,
    estimatedCost,
    fallbackUsed: input.routeIndex > 0,
    success: true,
    recordedAt: new Date().toISOString(),
  });

  recordRouterOutcome({
    taskCategory: input.plan.input.taskCategory,
    route: input.route,
    success: true,
    latencyMs: input.response.latencyMs,
    estimatedCost,
  });
}

function recordFailedRoute(input: {
  request: GatewayRequestDto;
  plan: RoutingPlan;
  route: ProviderRoute;
  routeIndex: number;
  latencyMs: number;
}): void {
  recordRouterMetric({
    runId: input.request.trace.runId,
    organizationId: input.request.scope.organizationId,
    taskCategory: input.plan.input.taskCategory,
    profile: input.plan.profile,
    provider: input.route.providerCode,
    model: input.route.modelCode,
    latencyMs: input.latencyMs,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCost: 0,
    fallbackUsed: input.routeIndex > 0,
    success: false,
    recordedAt: new Date().toISOString(),
  });

  recordRouterOutcome({
    taskCategory: input.plan.input.taskCategory,
    route: input.route,
    success: false,
    latencyMs: input.latencyMs,
    estimatedCost: 0,
  });
}

export async function completeWithModelRouter(
  request: GatewayRequestDto,
  execute: (routedRequest: GatewayRequestDto) => Promise<GatewayResponse>,
): Promise<GatewayResponse> {
  const plan = resolveRoutingPlan(request);

  if (plan.routes.length === 0) {
    throw new ExecutionUnavailableError();
  }

  let lastError: unknown;

  for (let index = 0; index < plan.routes.length; index += 1) {
    const route = plan.routes[index]!;
    const routedRequest: GatewayRequestDto = {
      ...request,
      providerCode: route.providerCode,
      modelCode: route.modelCode,
    };
    const startedAt = Date.now();

    try {
      const response = await execute(routedRequest);
      recordSuccessfulRoute({ request, plan, route, routeIndex: index, response });
      return response;
    } catch (error) {
      lastError = error;
      recordFailedRoute({
        request,
        plan,
        route,
        routeIndex: index,
        latencyMs: Date.now() - startedAt,
      });

      const isLastRoute = index === plan.routes.length - 1;
      const canFallback = !isLastRoute && isFallbackEligibleError(error);

      if (!canFallback) {
        break;
      }
    }
  }

  if (usesIntelligentRouting(request)) {
    throw new ExecutionUnavailableError();
  }

  throw lastError instanceof Error ? lastError : new ExecutionUnavailableError();
}

export async function* streamWithModelRouter(
  request: GatewayRequestDto,
  execute: (routedRequest: GatewayRequestDto) => AsyncGenerator<StreamChunk>,
): AsyncGenerator<StreamChunk> {
  const plan = resolveRoutingPlan(request);

  if (plan.routes.length === 0) {
    throw new ExecutionUnavailableError();
  }

  let lastError: unknown;

  for (let index = 0; index < plan.routes.length; index += 1) {
    const route = plan.routes[index]!;
    const routedRequest: GatewayRequestDto = {
      ...request,
      providerCode: route.providerCode,
      modelCode: route.modelCode,
    };
    const startedAt = Date.now();

    try {
      yield* execute(routedRequest);

      recordRouterMetric({
        runId: request.trace.runId,
        organizationId: request.scope.organizationId,
        taskCategory: plan.input.taskCategory,
        profile: plan.profile,
        provider: route.providerCode,
        model: route.modelCode,
        latencyMs: Date.now() - startedAt,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: 0,
        fallbackUsed: index > 0,
        success: true,
        recordedAt: new Date().toISOString(),
      });

      recordRouterOutcome({
        taskCategory: plan.input.taskCategory,
        route,
        success: true,
        latencyMs: Date.now() - startedAt,
        estimatedCost: 0,
      });

      return;
    } catch (error) {
      lastError = error;
      recordFailedRoute({
        request,
        plan,
        route,
        routeIndex: index,
        latencyMs: Date.now() - startedAt,
      });

      const isLastRoute = index === plan.routes.length - 1;
      const canFallback = !isLastRoute && isFallbackEligibleError(error);

      if (!canFallback) {
        break;
      }
    }
  }

  if (usesIntelligentRouting(request)) {
    throw new ExecutionUnavailableError();
  }

  throw lastError instanceof Error ? lastError : new ExecutionUnavailableError();
}

export {
  classifyTaskCategory,
  buildRouterInputFromGatewayRequest,
  buildRoutingHintsFromContext,
} from '@/lib/ai/routing-context';
export { rankProviderRoutes, resolveRoutingProfileForInput } from '@/lib/ai/router-scoring';
export {
  getRoutingTable,
  resetRoutingTable,
  setRoutingTable,
  DEFAULT_ROUTING_TABLE,
} from '@/lib/ai/routing-config';
export { getRouterMetrics, resetRouterMetrics } from '@/lib/ai/router-metrics';
export { listRouterPerformanceSnapshots, resetRouterStats } from '@/lib/ai/router-stats';
