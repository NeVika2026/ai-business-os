import { getProviderJurisdiction } from '@/services/runtime/gateway/provider-metadata';

import type { OrganizationModelPolicy, ProviderRouteRef } from '@/services/runtime/gateway/policy/types';

function routeKey(route: ProviderRouteRef): string {
  return `${route.providerCode}:${route.modelCode}`;
}

function isRouteInAllowlist(route: ProviderRouteRef, allowlist: ProviderRouteRef[]): boolean {
  return allowlist.some((entry) => {
    if (entry.providerCode !== route.providerCode) {
      return false;
    }

    if (!entry.modelCode) {
      return true;
    }

    return entry.modelCode === route.modelCode;
  });
}

/**
 * Pure policy filter applied after task-based routing and before execution.
 * Gateway is the only caller — UI never sees filtered routes.
 */
export function filterRoutesByOrgPolicy(
  routes: ProviderRouteRef[],
  policy: OrganizationModelPolicy,
): ProviderRouteRef[] {
  switch (policy.mode) {
    case 'auto':
      return routes;

    case 'russia_only':
      return routes.filter((route) => getProviderJurisdiction(route.providerCode) === 'russia');

    case 'international_only':
      return routes.filter((route) => getProviderJurisdiction(route.providerCode) === 'international');

    case 'local_only':
      return routes.filter((route) => getProviderJurisdiction(route.providerCode) === 'local');

    case 'custom': {
      const allowlist = policy.customAllowlist ?? [];
      return routes.filter((route) => isRouteInAllowlist(route, allowlist));
    }

    default:
      return routes;
  }
}

export function dedupeRoutes(routes: ProviderRouteRef[]): ProviderRouteRef[] {
  const seen = new Set<string>();
  const merged: ProviderRouteRef[] = [];

  for (const route of routes) {
    const key = routeKey(route);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(route);
  }

  return merged;
}
