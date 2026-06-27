import { MockProviderAdapter } from '@/services/runtime/gateway/adapters/base';

class OpenRouterAdapter extends MockProviderAdapter {
  readonly code = 'openrouter' as const;
}

export const openRouterAdapter = new OpenRouterAdapter();
