import { MockProviderAdapter } from '@/services/runtime/gateway/adapters/base';

class OpenAiAdapter extends MockProviderAdapter {
  readonly code = 'openai' as const;
}

export const openAiAdapter = new OpenAiAdapter();
