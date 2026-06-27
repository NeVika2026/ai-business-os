import type {
  GatewayRequest,
  GatewayResponse,
  TenantScope,
  TraceContext,
} from '@/types/runtime/dto';
import type { NormalizedProviderRequest, StreamChunk } from '@/services/runtime/gateway/types';

export type RuntimeGatewayCompleteRequest = GatewayRequest;
export type RuntimeGatewayCompleteResponse = GatewayResponse;

export type RuntimeGatewayStreamRequest = GatewayRequest;

export interface RuntimeGatewayStreamChunk {
  contentDelta: string;
  finishReason: string | null;
  done: boolean;
}

export interface RuntimeGatewayEmbeddingsRequest {
  scope: TenantScope;
  trace: TraceContext;
  modelId: string;
  input: string[];
}

export interface RuntimeGatewayEmbeddingsResponse {
  modelId: string;
  dimensions: number;
  vectors: number[][];
}

export interface RuntimeGatewayModelEntry {
  id: string;
  modelCode: string;
  contextWindow: number;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsJson: boolean;
  supportsStreaming: boolean;
  supportsReasoning: boolean;
}

export interface RuntimeGatewayModelsResponse {
  models: RuntimeGatewayModelEntry[];
}

export interface RuntimeGatewayHealthEntry {
  id: string;
  ok: boolean;
  latencyMs: number;
  message: string | null;
}

export interface RuntimeGatewayHealthResponse {
  ok: boolean;
  entries: RuntimeGatewayHealthEntry[];
}

export type RuntimeGatewayOperation =
  | 'complete'
  | 'stream'
  | 'embeddings'
  | 'models'
  | 'health'
  | null;

export interface RuntimeGatewaySnapshot {
  lastOperation: RuntimeGatewayOperation;
  lastRunId: string | null;
  lastModelId: string | null;
  updatedAt: string;
}

export interface SerializedRuntimeGatewaySnapshot {
  lastOperation: RuntimeGatewayOperation;
  lastRunId: string | null;
  lastModelId: string | null;
  updatedAt: string;
}

export interface RuntimeGatewayDependencies {
  complete: (request: GatewayRequest) => Promise<GatewayResponse>;
  checkAllHealth: () => Promise<
    Array<{
      ok: boolean;
      latencyMs: number;
      providerCode: string;
      message?: string;
    }>
  >;
  getCapabilitiesRegistry: () => Record<
    string,
    Record<
      string,
      {
        contextWindow: number;
        supportsTools: boolean;
        supportsVision: boolean;
        supportsJson: boolean;
        supportsStreaming: boolean;
        supportsReasoning: boolean;
      }
    >
  >;
  getAdapter: (providerCode: string) => {
    stream: (request: NormalizedProviderRequest) => AsyncGenerator<StreamChunk>;
    health: () => Promise<{
      ok: boolean;
      latencyMs: number;
      providerCode: string;
      message?: string;
    }>;
  };
  hasModel: (providerCode: string, modelCode: string) => boolean;
  normalizeRequest: (request: GatewayRequest) => NormalizedProviderRequest;
}

export interface RuntimeGatewayAdapterOptions {
  dependencies?: Partial<RuntimeGatewayDependencies>;
}

export function buildRuntimeModelId(providerCode: string, modelCode: string): string {
  return `${providerCode}/${modelCode}`;
}

export function parseRuntimeModelId(modelId: string): { providerCode: string; modelCode: string } {
  const separatorIndex = modelId.indexOf('/');

  if (separatorIndex <= 0 || separatorIndex === modelId.length - 1) {
    throw new Error(`Invalid runtime model id: ${modelId}`);
  }

  return {
    providerCode: modelId.slice(0, separatorIndex),
    modelCode: modelId.slice(separatorIndex + 1),
  };
}
