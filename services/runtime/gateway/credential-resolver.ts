import { ProviderAuthError } from '@/services/runtime/gateway/provider-errors';
import type { ProviderCode, ProviderCredentials } from '@/services/runtime/gateway/types';

const ENV_KEYS: Record<ProviderCode, { apiKey?: string; baseUrl?: string }> = {
  openai: { apiKey: 'OPENAI_API_KEY', baseUrl: 'OPENAI_BASE_URL' },
  anthropic: { apiKey: 'ANTHROPIC_API_KEY', baseUrl: 'ANTHROPIC_BASE_URL' },
  gemini: { apiKey: 'GOOGLE_AI_API_KEY', baseUrl: 'GOOGLE_AI_BASE_URL' },
  groq: { apiKey: 'GROQ_API_KEY', baseUrl: 'GROQ_BASE_URL' },
  openrouter: { apiKey: 'OPENROUTER_API_KEY', baseUrl: 'OPENROUTER_BASE_URL' },
  ollama: { baseUrl: 'OLLAMA_BASE_URL' },
  fugu: { apiKey: 'FUGU_API_KEY', baseUrl: 'FUGU_BASE_URL' },
};

const DEFAULT_BASE_URLS: Partial<Record<ProviderCode, string>> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  ollama: 'http://127.0.0.1:11434',
};

export interface TenantCredentialLookup {
  (providerCode: ProviderCode, organizationId?: string): ProviderCredentials | null;
}

export interface CredentialResolverOptions {
  tenantLookup?: TenantCredentialLookup;
}

export function resolveProviderCredentials(
  providerCode: ProviderCode,
  organizationId?: string,
  options?: CredentialResolverOptions,
): ProviderCredentials {
  const tenantCredentials = options?.tenantLookup?.(providerCode, organizationId);
  if (tenantCredentials?.apiKey || tenantCredentials?.baseUrl) {
    return {
      apiKey: tenantCredentials.apiKey,
      baseUrl: tenantCredentials.baseUrl ?? readEnvBaseUrl(providerCode),
      extraHeaders: tenantCredentials.extraHeaders,
    };
  }

  const mapping = ENV_KEYS[providerCode];
  const apiKey = mapping.apiKey ? readEnv(mapping.apiKey) : undefined;
  const baseUrl = readEnvBaseUrl(providerCode);

  if (providerCode !== 'ollama' && !apiKey) {
    throw new ProviderAuthError(providerCode, `missing credential: ${mapping.apiKey}`);
  }

  return {
    apiKey,
    baseUrl,
    extraHeaders: providerCode === 'openrouter' ? buildOpenRouterHeaders() : undefined,
  };
}

export function hasProviderCredentials(providerCode: ProviderCode): boolean {
  try {
    resolveProviderCredentials(providerCode);
    return true;
  } catch {
    return false;
  }
}

function readEnvBaseUrl(providerCode: ProviderCode): string | undefined {
  const mapping = ENV_KEYS[providerCode];
  const raw =
    (mapping.baseUrl ? readEnv(mapping.baseUrl) : undefined) ?? DEFAULT_BASE_URLS[providerCode];

  return raw?.replace(/\/$/, '');
}

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function buildOpenRouterHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const referer = process.env.OPENROUTER_HTTP_REFERER?.trim();
  const title = process.env.OPENROUTER_APP_TITLE?.trim();
  if (referer) headers['HTTP-Referer'] = referer;
  if (title) headers['X-Title'] = title;
  return headers;
}
