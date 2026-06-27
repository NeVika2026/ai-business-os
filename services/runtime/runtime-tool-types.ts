import type { ToolResult } from '@/types/runtime/dto';
import type { ToolRegistry } from '@/services/runtime/tools/registry';
import type {
  ToolExecution,
  ToolValidationResult,
} from '@/services/runtime/tools/executor/executor-types';

export type RuntimeToolRequest = ToolExecution;

export interface RuntimeToolSummary {
  id: string;
  category: string;
  enabled: boolean;
  description: string;
}

export interface RuntimeToolListResponse {
  tools: RuntimeToolSummary[];
}

export interface RuntimeToolValidationView {
  valid: boolean;
  errors: string[];
}

export type RuntimeToolOperation = 'execute' | 'validate' | 'list' | null;

export interface RuntimeToolSnapshot {
  lastOperation: RuntimeToolOperation;
  lastToolId: string | null;
  lastSuccess: boolean | null;
  updatedAt: string;
}

export interface SerializedRuntimeToolSnapshot {
  lastOperation: RuntimeToolOperation;
  lastToolId: string | null;
  lastSuccess: boolean | null;
  updatedAt: string;
}

export interface SerializedRuntimeToolResult {
  toolCallId: string;
  name: string;
  success: boolean;
  output: Record<string, unknown> | string | null;
  error: {
    code: string;
    message: string;
  } | null;
  audit: {
    runId: string;
    durationMs: number;
    approvalRequired: boolean;
    approved: boolean;
    idempotencyKey: string;
    executedAt: string;
  };
}

export interface RuntimeToolDependencies {
  execute: (request: ToolExecution) => Promise<ToolResult>;
  validate: (request: ToolExecution) => ToolValidationResult;
  hasTool: (toolId: string) => boolean;
  listTools: () => RuntimeToolSummary[];
}

export interface RuntimeToolAdapterOptions {
  registry?: ToolRegistry;
  dependencies?: Partial<RuntimeToolDependencies>;
}

export type { ToolResult };
