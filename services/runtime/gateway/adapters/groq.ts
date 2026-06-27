import { MockProviderAdapter } from '@/services/runtime/gateway/adapters/base';

class GroqAdapter extends MockProviderAdapter {
  readonly code = 'groq' as const;
}

export const groqAdapter = new GroqAdapter();
