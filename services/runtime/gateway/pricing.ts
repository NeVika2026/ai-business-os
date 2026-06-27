import modelPricing from '@/services/runtime/gateway/data/model-pricing.json';
import type { ModelPricing, ProviderCode } from '@/services/runtime/gateway/types';

type PricingRegistry = Record<string, Record<string, ModelPricing>>;

const registry = modelPricing as PricingRegistry;

export function getModelPricing(
  providerCode: ProviderCode | string,
  modelCode: string,
): ModelPricing | null {
  return registry[providerCode]?.[modelCode] ?? null;
}

export function listPricedModels(providerCode: ProviderCode | string): string[] {
  const models = registry[providerCode];
  return models ? Object.keys(models) : [];
}

export function getPricingRegistry(): PricingRegistry {
  return registry;
}

/**
 * Placeholder for future cost calculation (C6).
 * Returns null until billing logic is implemented.
 */
export function estimateCost(
  providerCode: ProviderCode | string,
  modelCode: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  void providerCode;
  void modelCode;
  void inputTokens;
  void outputTokens;
  return null;
}
