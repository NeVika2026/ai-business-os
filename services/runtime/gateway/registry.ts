import {
  createGatewayAdapters,
  isGatewayMockMode,
} from '@/services/runtime/gateway/adapter-factory';
import { ProviderNotFoundError } from '@/services/runtime/gateway/errors';
import type { ProviderAdapter, ProviderCode } from '@/services/runtime/gateway/types';

let activeAdapters = createGatewayAdapters(isGatewayMockMode());

export function setGatewayMockMode(enabled: boolean): void {
  process.env.GATEWAY_USE_MOCK = enabled ? 'true' : 'false';
  activeAdapters = createGatewayAdapters(enabled);
}

export function refreshGatewayAdapters(): void {
  activeAdapters = createGatewayAdapters(isGatewayMockMode());
}

export function registerAdapter(code: ProviderCode, adapter: ProviderAdapter): void {
  activeAdapters[code] = adapter;
}

export function getAdapter(code: string): ProviderAdapter {
  const adapter = activeAdapters[code as ProviderCode];

  if (!adapter) {
    throw new ProviderNotFoundError(code);
  }

  return adapter;
}

export function listAdapters(): ProviderAdapter[] {
  return Object.values(activeAdapters);
}

export function listProviderCodes(): ProviderCode[] {
  return Object.keys(activeAdapters) as ProviderCode[];
}
