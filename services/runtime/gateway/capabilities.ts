import modelCapabilities from '@/services/runtime/gateway/data/model-capabilities.json';
import type { ModelCapabilities, ProviderCode } from '@/services/runtime/gateway/types';

type CapabilitiesRegistry = Record<string, Record<string, ModelCapabilities>>;

const registry = modelCapabilities as CapabilitiesRegistry;

export function getModelCapabilities(
  providerCode: ProviderCode | string,
  modelCode: string,
): ModelCapabilities | null {
  return registry[providerCode]?.[modelCode] ?? null;
}

export function listProviderModels(providerCode: ProviderCode | string): string[] {
  const models = registry[providerCode];
  return models ? Object.keys(models) : [];
}

export function hasModel(providerCode: ProviderCode | string, modelCode: string): boolean {
  return getModelCapabilities(providerCode, modelCode) !== null;
}

export function getCapabilitiesRegistry(): CapabilitiesRegistry {
  return registry;
}
