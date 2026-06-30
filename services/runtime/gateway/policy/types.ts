import type { ProviderCode } from '@/services/runtime/gateway/types';

/**
 * Organization-level model selection policy.
 * Resolved server-side from tenant settings — never accepted from client input.
 */
export type OrganizationModelPolicyMode =
  | 'auto'
  | 'russia_only'
  | 'international_only'
  | 'local_only'
  | 'custom';

export type ProviderRouteRef = {
  providerCode: ProviderCode | string;
  /** When omitted in custom allowlist, all models for the provider are allowed. */
  modelCode?: string;
};

export type OrganizationModelPolicy = {
  organizationId: string;
  mode: OrganizationModelPolicyMode;
  /** Required when mode === 'custom'. Empty allowlist means no models are permitted. */
  customAllowlist?: ProviderRouteRef[];
  updatedAt: string;
};

export const DEFAULT_ORGANIZATION_MODEL_POLICY: OrganizationModelPolicy = {
  organizationId: '',
  mode: 'auto',
  updatedAt: '1970-01-01T00:00:00.000Z',
};

export type UniversalGatewayExecutionMeta = {
  organizationId: string;
  policyMode: OrganizationModelPolicyMode;
  resolvedProvider: string;
  resolvedModel: string;
  routeIndex: number;
  fallbackUsed: boolean;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  success: boolean;
};
