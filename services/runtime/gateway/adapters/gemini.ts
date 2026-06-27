import { MockProviderAdapter } from '@/services/runtime/gateway/adapters/base';

class GeminiAdapter extends MockProviderAdapter {
  readonly code = 'gemini' as const;
}

export const geminiAdapter = new GeminiAdapter();
