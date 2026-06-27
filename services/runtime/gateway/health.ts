import { getAdapter, listProviderCodes } from '@/services/runtime/gateway/registry';
import type { ProviderHealthResult } from '@/services/runtime/gateway/types';

export async function checkProviderHealth(providerCode: string): Promise<ProviderHealthResult> {
  const adapter = getAdapter(providerCode);
  return adapter.health();
}

export async function checkAllProvidersHealth(): Promise<ProviderHealthResult[]> {
  const codes = listProviderCodes();
  return Promise.all(codes.map((code) => checkProviderHealth(code)));
}
