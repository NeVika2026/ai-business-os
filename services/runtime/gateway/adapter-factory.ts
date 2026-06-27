import { MockProviderAdapter } from '@/services/runtime/gateway/adapters/base';
import { HttpAnthropicAdapter } from '@/services/runtime/gateway/adapters/http-anthropic-adapter';
import { HttpGeminiAdapter } from '@/services/runtime/gateway/adapters/http-gemini-adapter';
import {
  HttpOllamaAdapter,
  HttpOpenAiCompatibleAdapter,
} from '@/services/runtime/gateway/adapters/http-adapters';
import type { ProviderAdapter, ProviderCode } from '@/services/runtime/gateway/types';

class OpenAiMockAdapter extends MockProviderAdapter {
  readonly code = 'openai' as const;
}

class AnthropicMockAdapter extends MockProviderAdapter {
  readonly code = 'anthropic' as const;
}

class GeminiMockAdapter extends MockProviderAdapter {
  readonly code = 'gemini' as const;
}

class GroqMockAdapter extends MockProviderAdapter {
  readonly code = 'groq' as const;
}

class OpenRouterMockAdapter extends MockProviderAdapter {
  readonly code = 'openrouter' as const;
}

class OllamaMockAdapter extends MockProviderAdapter {
  readonly code = 'ollama' as const;
}

export function isGatewayMockMode(): boolean {
  return process.env.GATEWAY_USE_MOCK === 'true';
}

export function createProductionAdapters(): Record<ProviderCode, ProviderAdapter> {
  return {
    openai: new HttpOpenAiCompatibleAdapter('openai'),
    anthropic: new HttpAnthropicAdapter(),
    gemini: new HttpGeminiAdapter(),
    groq: new HttpOpenAiCompatibleAdapter('groq'),
    openrouter: new HttpOpenAiCompatibleAdapter('openrouter'),
    ollama: new HttpOllamaAdapter(),
  };
}

export function createMockAdapters(): Record<ProviderCode, ProviderAdapter> {
  return {
    openai: new OpenAiMockAdapter(),
    anthropic: new AnthropicMockAdapter(),
    gemini: new GeminiMockAdapter(),
    groq: new GroqMockAdapter(),
    openrouter: new OpenRouterMockAdapter(),
    ollama: new OllamaMockAdapter(),
  };
}

export function createGatewayAdapters(
  useMock = isGatewayMockMode(),
): Record<ProviderCode, ProviderAdapter> {
  return useMock ? createMockAdapters() : createProductionAdapters();
}
