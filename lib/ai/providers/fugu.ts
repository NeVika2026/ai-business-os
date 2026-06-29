import { getModelCapabilities } from '@/services/runtime/gateway/capabilities';
import { fetchWithTimeout } from '@/services/runtime/gateway/http-client';
import { HttpOpenAiCompatibleAdapter } from '@/services/runtime/gateway/adapters/http-adapters';
import { ProviderAuthError } from '@/services/runtime/gateway/provider-errors';
import type {
  ModelCapabilities,
  NormalizedProviderRequest,
  NormalizedProviderResponse,
  ProviderAdapter,
  ProviderHealthResult,
  StreamChunk,
} from '@/services/runtime/gateway/types';

export const FUGU_PROVIDER_CODE = 'fugu' as const;

export type FuguConfig = {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
};

const ENV = {
  apiKey: 'FUGU_API_KEY',
  baseUrl: 'FUGU_BASE_URL',
  model: 'FUGU_MODEL',
} as const;

const DEFAULT_MODEL = 'fugu';

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function resolveFuguConfig(): FuguConfig | null {
  const apiKey = readEnv(ENV.apiKey);
  const baseUrl = readEnv(ENV.baseUrl);

  if (!apiKey || !baseUrl) {
    return null;
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ''),
    defaultModel: readEnv(ENV.model) ?? DEFAULT_MODEL,
  };
}

export function isFuguConfigured(): boolean {
  return resolveFuguConfig() !== null;
}

export function resolveFuguDefaultModel(): string {
  return resolveFuguConfig()?.defaultModel ?? DEFAULT_MODEL;
}

export class FuguProviderAdapter implements ProviderAdapter {
  readonly code = FUGU_PROVIDER_CODE;

  private readonly delegate = new HttpOpenAiCompatibleAdapter(FUGU_PROVIDER_CODE);

  async complete(request: NormalizedProviderRequest): Promise<NormalizedProviderResponse> {
    return this.delegate.complete(request);
  }

  async *stream(request: NormalizedProviderRequest): AsyncGenerator<StreamChunk> {
    yield* this.delegate.stream(request);
  }

  async health(): Promise<ProviderHealthResult> {
    const startedAt = Date.now();
    const config = resolveFuguConfig();

    if (!config) {
      return {
        ok: false,
        latencyMs: Date.now() - startedAt,
        providerCode: FUGU_PROVIDER_CODE,
        message: 'missing FUGU_API_KEY or FUGU_BASE_URL',
      };
    }

    try {
      const response = await fetchWithTimeout(
        `${config.baseUrl}/models`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
        },
        5000,
        FUGU_PROVIDER_CODE,
      );

      return {
        ok: response.ok,
        latencyMs: Date.now() - startedAt,
        providerCode: FUGU_PROVIDER_CODE,
        message: response.ok ? 'fugu reachable' : response.statusText,
      };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - startedAt,
        providerCode: FUGU_PROVIDER_CODE,
        message: error instanceof Error ? error.message : 'fugu health check failed',
      };
    }
  }

  capabilities(model: string): ModelCapabilities | null {
    return getModelCapabilities(FUGU_PROVIDER_CODE, model);
  }
}

export function createFuguAdapter(): ProviderAdapter {
  return new FuguProviderAdapter();
}

export function assertFuguCredentials(): void {
  if (!isFuguConfigured()) {
    throw new ProviderAuthError(FUGU_PROVIDER_CODE, 'missing FUGU_API_KEY or FUGU_BASE_URL');
  }
}
