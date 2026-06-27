import { MockProviderAdapter } from '@/services/runtime/gateway/adapters/base';

class OllamaAdapter extends MockProviderAdapter {
  readonly code = 'ollama' as const;
}

export const ollamaAdapter = new OllamaAdapter();
