import type {
  GatewayRequest,
  GatewayResponse,
  PromptMessage,
  ToolDefinition,
} from '@/types/runtime/dto';

export type ProviderCode = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter' | 'ollama';

export const PROVIDER_CODES: ProviderCode[] = [
  'openai',
  'anthropic',
  'gemini',
  'groq',
  'openrouter',
  'ollama',
];

export interface ProviderCredentials {
  apiKey?: string;
  baseUrl?: string;
  extraHeaders?: Record<string, string>;
}

export interface NormalizedProviderRequest {
  model: string;
  messages: PromptMessage[];
  tools?: ToolDefinition[];
  temperature: number;
  maxTokens: number;
  topP?: number;
  timeoutMs: number;
  credentials: ProviderCredentials;
}

export interface NormalizedProviderResponse {
  content: string | null;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  finishReason: string;
  providerRequestId?: string;
  latencyMs: number;
  raw?: unknown;
}

export interface StreamChunk {
  contentDelta: string;
  finishReason?: string;
  done: boolean;
}

export interface ModelCapabilities {
  contextWindow: number;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsJson: boolean;
  supportsStreaming: boolean;
  supportsReasoning: boolean;
}

export interface ProviderHealthResult {
  ok: boolean;
  latencyMs: number;
  providerCode: ProviderCode;
  message?: string;
}

export interface ModelPricing {
  inputPer1k: number;
  outputPer1k: number;
  currency: string;
}

export type { GatewayRequest, GatewayResponse };

export interface ProviderAdapter {
  readonly code: ProviderCode;
  complete(request: NormalizedProviderRequest): Promise<NormalizedProviderResponse>;
  stream(request: NormalizedProviderRequest): AsyncGenerator<StreamChunk>;
  health(): Promise<ProviderHealthResult>;
  capabilities(model: string): ModelCapabilities | null;
}
