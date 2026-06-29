import { isGatewayMockMode } from '@/services/runtime/gateway/adapter-factory';
import { hasModel } from '@/services/runtime/gateway/capabilities';
import { hasProviderCredentials } from '@/services/runtime/gateway/credential-resolver';

import {
  getConfiguredRoutes,
  getGlobalFallbackRoutes,
  mergeRoutes,
  resolveRoutingProfile,
} from '@/lib/ai/routing-config';
import { getLearningBoost } from '@/lib/ai/router-stats';
import type { ProviderRoute, RouterInput, RoutingPlan, RoutingProfile } from '@/lib/ai/routing-types';

function isRouteAvailable(route: ProviderRoute): boolean {
  if (!hasModel(route.providerCode, route.modelCode)) {
    return false;
  }

  if (isGatewayMockMode()) {
    return true;
  }

  return hasProviderCredentials(route.providerCode);
}

function scoreRoute(route: ProviderRoute, input: RouterInput, index: number): number {
  let score = 100 - index * 5;

  if (input.latencyTarget === 'fast' && route.modelCode.includes('haiku')) {
    score += 20;
  }

  if (input.latencyTarget === 'quality' && !route.modelCode.includes('mini') && !route.modelCode.includes('haiku')) {
    score += 15;
  }

  if (input.costTarget === 'low' && (route.modelCode.includes('mini') || route.modelCode.includes('haiku'))) {
    score += 15;
  }

  if (input.costTarget === 'quality' && route.providerCode === 'anthropic') {
    score += 10;
  }

  if (input.reasoningComplexity === 'high' && route.providerCode === 'anthropic') {
    score += 10;
  }

  if (input.toolUsage && route.providerCode === 'openai') {
    score += 5;
  }

  if (input.estimatedContextLength >= 32_000 && route.providerCode === 'gemini') {
    score += 25;
  }

  score += getLearningBoost(input.taskCategory, route);

  return score;
}

function scoreAndSortRoutes(routes: ProviderRoute[], input: RouterInput): ProviderRoute[] {
  return routes
    .map((route, index) => ({
      route,
      score: scoreRoute(route, input, index),
    }))
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.route);
}

export function rankProviderRoutes(input: RouterInput): RoutingPlan {
  const profile = resolveRoutingProfile(input);
  const configured = getConfiguredRoutes(profile);
  const merged = mergeRoutes(configured, getGlobalFallbackRoutes());
  const available = merged.filter(isRouteAvailable);
  const routes = scoreAndSortRoutes(available.length > 0 ? available : merged.filter(isRouteAvailable), input);

  return {
    input,
    profile,
    routes,
  };
}

export function resolveRoutingProfileForInput(input: RouterInput): RoutingProfile {
  return resolveRoutingProfile(input);
}

export function filterAvailableRoutes(routes: ProviderRoute[]): ProviderRoute[] {
  return routes.filter(isRouteAvailable);
}

export { isRouteAvailable };
