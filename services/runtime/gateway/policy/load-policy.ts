import type { OrganizationModelPolicy } from '@/services/runtime/gateway/policy/types';

const organizationPolicies = new Map<string, OrganizationModelPolicy>();

/**
 * Loads organization model policy on the server.
 * Defaults to `auto` when no policy is configured for the tenant.
 */
export function loadOrganizationModelPolicy(organizationId: string): OrganizationModelPolicy {
  const stored = organizationPolicies.get(organizationId);

  if (stored) {
    return stored;
  }

  return {
    organizationId,
    mode: 'auto',
    updatedAt: '1970-01-01T00:00:00.000Z',
  };
}

export function setOrganizationModelPolicy(policy: OrganizationModelPolicy): void {
  organizationPolicies.set(policy.organizationId, policy);
}

export function resetOrganizationModelPolicies(): void {
  organizationPolicies.clear();
}
