import type { ProviderCode } from '@/services/runtime/gateway/types';

/**
 * Provider jurisdiction for organization policy filtering.
 * `local` = on-prem / self-hosted (Ollama, vLLM, etc.).
 */
export type ProviderJurisdiction = 'russia' | 'international' | 'local';

/**
 * Transport used by the adapter implementation.
 * Most new providers should implement `openai-compatible` first.
 */
export type ProviderTransportKind =
  | 'openai-compatible'
  | 'anthropic-native'
  | 'gemini-native'
  | 'ollama-native'
  | 'custom';

export type ProviderDefinition = {
  code: ProviderCode | PlannedProviderCode;
  displayName: string;
  jurisdiction: ProviderJurisdiction;
  transport: ProviderTransportKind;
  /** True when adapter is registered in adapter-factory today. */
  implemented: boolean;
  defaultBaseUrl?: string;
  credentialEnvKeys?: {
    apiKey?: string;
    baseUrl?: string;
  };
};

/** Planned codes — extend ProviderCode union when adapter ships. */
export type PlannedProviderCode = 'gigachat' | 'yandexgpt';

export const PROVIDER_DEFINITIONS: Record<ProviderCode | PlannedProviderCode, ProviderDefinition> = {
  openai: {
    code: 'openai',
    displayName: 'OpenAI',
    jurisdiction: 'international',
    transport: 'openai-compatible',
    implemented: true,
    defaultBaseUrl: 'https://api.openai.com/v1',
    credentialEnvKeys: { apiKey: 'OPENAI_API_KEY', baseUrl: 'OPENAI_BASE_URL' },
  },
  anthropic: {
    code: 'anthropic',
    displayName: 'Anthropic',
    jurisdiction: 'international',
    transport: 'anthropic-native',
    implemented: true,
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    credentialEnvKeys: { apiKey: 'ANTHROPIC_API_KEY', baseUrl: 'ANTHROPIC_BASE_URL' },
  },
  gemini: {
    code: 'gemini',
    displayName: 'Google Gemini',
    jurisdiction: 'international',
    transport: 'gemini-native',
    implemented: true,
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    credentialEnvKeys: { apiKey: 'GOOGLE_AI_API_KEY', baseUrl: 'GOOGLE_AI_BASE_URL' },
  },
  groq: {
    code: 'groq',
    displayName: 'Groq',
    jurisdiction: 'international',
    transport: 'openai-compatible',
    implemented: true,
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    credentialEnvKeys: { apiKey: 'GROQ_API_KEY', baseUrl: 'GROQ_BASE_URL' },
  },
  openrouter: {
    code: 'openrouter',
    displayName: 'OpenRouter',
    jurisdiction: 'international',
    transport: 'openai-compatible',
    implemented: true,
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    credentialEnvKeys: { apiKey: 'OPENROUTER_API_KEY', baseUrl: 'OPENROUTER_BASE_URL' },
  },
  ollama: {
    code: 'ollama',
    displayName: 'Ollama',
    jurisdiction: 'local',
    transport: 'ollama-native',
    implemented: true,
    defaultBaseUrl: 'http://127.0.0.1:11434',
    credentialEnvKeys: { baseUrl: 'OLLAMA_BASE_URL' },
  },
  fugu: {
    code: 'fugu',
    displayName: 'Fugu',
    jurisdiction: 'international',
    transport: 'openai-compatible',
    implemented: true,
    credentialEnvKeys: { apiKey: 'FUGU_API_KEY', baseUrl: 'FUGU_BASE_URL' },
  },
  gigachat: {
    code: 'gigachat',
    displayName: 'GigaChat',
    jurisdiction: 'russia',
    transport: 'openai-compatible',
    implemented: false,
    defaultBaseUrl: 'https://gigachat.devices.sberbank.ru/api/v1',
    credentialEnvKeys: { apiKey: 'GIGACHAT_API_KEY', baseUrl: 'GIGACHAT_BASE_URL' },
  },
  yandexgpt: {
    code: 'yandexgpt',
    displayName: 'YandexGPT',
    jurisdiction: 'russia',
    transport: 'openai-compatible',
    implemented: false,
    defaultBaseUrl: 'https://llm.api.cloud.yandex.net/v1',
    credentialEnvKeys: { apiKey: 'YANDEXGPT_API_KEY', baseUrl: 'YANDEXGPT_BASE_URL' },
  },
};

export function getProviderDefinition(code: string): ProviderDefinition | null {
  return PROVIDER_DEFINITIONS[code as ProviderCode | PlannedProviderCode] ?? null;
}

export function getProviderJurisdiction(code: string): ProviderJurisdiction | null {
  return getProviderDefinition(code)?.jurisdiction ?? null;
}
