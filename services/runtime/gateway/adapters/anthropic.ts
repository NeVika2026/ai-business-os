import { MockProviderAdapter } from '@/services/runtime/gateway/adapters/base';

class AnthropicAdapter extends MockProviderAdapter {
  readonly code = 'anthropic' as const;
}

export const anthropicAdapter = new AnthropicAdapter();
