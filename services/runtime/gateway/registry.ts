import { anthropicAdapter } from '@/services/runtime/gateway/adapters/anthropic';
import { geminiAdapter } from '@/services/runtime/gateway/adapters/gemini';
import { groqAdapter } from '@/services/runtime/gateway/adapters/groq';
import { ollamaAdapter } from '@/services/runtime/gateway/adapters/ollama';
import { openAiAdapter } from '@/services/runtime/gateway/adapters/openai';
import { openRouterAdapter } from '@/services/runtime/gateway/adapters/openrouter';
import { ProviderNotFoundError } from '@/services/runtime/gateway/errors';
import type { ProviderAdapter, ProviderCode } from '@/services/runtime/gateway/types';

const adapters: Record<ProviderCode, ProviderAdapter> = {
  openai: openAiAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
  groq: groqAdapter,
  openrouter: openRouterAdapter,
  ollama: ollamaAdapter,
};

export function registerAdapter(code: ProviderCode, adapter: ProviderAdapter) {
  adapters[code] = adapter;
}

export function getAdapter(code: string): ProviderAdapter {
  const adapter = adapters[code as ProviderCode];

  if (!adapter) {
    throw new ProviderNotFoundError(code);
  }

  return adapter;
}

export function listAdapters(): ProviderAdapter[] {
  return Object.values(adapters);
}

export function listProviderCodes(): ProviderCode[] {
  return Object.keys(adapters) as ProviderCode[];
}
