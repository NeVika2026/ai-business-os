export type UUID = string;
export type ISODateTime = string;

export interface TenantScope {
  organizationId: UUID;
  projectId?: UUID | null;
  userId?: UUID | null;
}

export interface TraceContext {
  runId: UUID;
  correlationId: UUID;
  parentRunId?: UUID | null;
  traceId: UUID;
}

export interface ContextPackage {
  scope: TenantScope;
  trace: TraceContext;
  employee: {
    id: UUID;
    name: string;
    roleTitle: string;
    systemPrompt: string | null;
    configuration: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    };
    tools: Array<{ id: string; enabled: boolean }>;
    permissions: Record<string, boolean>;
  };
  provider: {
    id: UUID;
    code: string;
  };
  model: {
    id: UUID;
    code: string;
    contextWindow: number | null;
    supportsTools: boolean;
  };
  task?: {
    id: UUID;
    title: string;
    input: Record<string, unknown>;
  } | null;
  userIntent: {
    action: string;
    payload: Record<string, unknown>;
  };
  retrievedAt: ISODateTime;
}

export interface KnowledgeChunkRef {
  chunkId: UUID;
  itemId: UUID;
  sourceId: UUID;
  sourceTitle: string;
  content: string;
  score?: number;
  tokenEstimate?: number;
}

export interface KnowledgePackage {
  scope: TenantScope;
  trace: TraceContext;
  query: string;
  chunks: KnowledgeChunkRef[];
  totalChunks: number;
  truncated: boolean;
  retrievedAt: ISODateTime;
}

export interface MemoryEntry {
  id: UUID;
  scope: 'organization' | 'ai_employee' | 'project' | string;
  content: string;
  importance: number;
  lastUsedAt?: ISODateTime | null;
}

export interface MemoryPackage {
  scope: TenantScope;
  trace: TraceContext;
  employeeId: UUID;
  entries: MemoryEntry[];
  enabled: boolean;
  retrievedAt: ISODateTime;
}

export type PromptRole = 'system' | 'user' | 'assistant' | 'tool';

export interface PromptMessage {
  role: PromptRole;
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface PromptRequest {
  scope: TenantScope;
  trace: TraceContext;
  model: string;
  messages: PromptMessage[];
  tools?: ToolDefinition[];
  parameters: {
    temperature: number;
    maxTokens: number;
    topP?: number;
  };
  metadata: {
    employeeId: UUID;
    compilerVersion: string;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  audit: {
    runId: UUID;
    employeeId: UUID;
    organizationId: UUID;
    requestedAt: ISODateTime;
  };
}

export interface PromptResponse {
  trace: TraceContext;
  content: string | null;
  toolCalls: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
  raw?: Record<string, unknown>;
}

export interface GatewayRequest {
  scope: TenantScope;
  trace: TraceContext;
  providerCode: string;
  modelCode: string;
  messages: PromptMessage[];
  tools?: ToolDefinition[];
  parameters: {
    temperature: number;
    maxTokens: number;
    topP?: number;
  };
  timeoutMs: number;
  retryPolicy: {
    maxAttempts: number;
    backoffMs: number[];
  };
}

export interface GatewayResponse {
  trace: TraceContext;
  providerCode: string;
  modelCode: string;
  content: string | null;
  toolCalls: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  finishReason: string;
  providerRequestId?: string;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  success: boolean;
  output: Record<string, unknown> | string | null;
  error?: {
    code: string;
    message: string;
  };
  audit: {
    runId: UUID;
    durationMs: number;
    approvalRequired: boolean;
    approved: boolean;
    idempotencyKey: string;
    executedAt: ISODateTime;
  };
}

export interface AgentExecution {
  scope: TenantScope;
  employeeId: UUID;
  taskId?: UUID | null;
  parentRunId?: UUID | null;
  input: {
    action: string;
    payload: Record<string, unknown>;
  };
  options?: {
    dryRun?: boolean;
    maxToolRounds?: number;
    skipMemoryWrite?: boolean;
  };
}

export interface AgentResult {
  trace: TraceContext;
  status: 'completed' | 'failed' | 'cancelled';
  output: Record<string, unknown> | null;
  error?: {
    code: string;
    message: string;
    stage: 'context' | 'prompt' | 'pipeline' | 'gateway' | 'tool' | 'memory';
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    toolCallCount: number;
    gatewayCallCount: number;
  };
  timeline: Array<{
    stage: string;
    startedAt: ISODateTime;
    durationMs: number;
    status: 'ok' | 'error';
  }>;
  completedAt: ISODateTime;
}
