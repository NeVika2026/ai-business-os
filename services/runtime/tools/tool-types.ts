import type { BaseToolHandler } from '@/services/runtime/tools/handlers/base-handler';

export const TOOL_CATEGORIES = [
  'crm',
  'knowledge',
  'ai',
  'communication',
  'files',
  'web',
  'storage',
  'integrations',
  'system',
  'mcp',
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export interface ToolRetryPolicy {
  maxAttempts: number;
  backoffMs: number[];
  retryableErrors: string[];
}

export interface ToolPermissionSpec {
  requiredFlags: string[];
  allowedRoles?: string[];
  deniedRoles?: string[];
  orgFeatureFlag?: string;
  categoryDefault: boolean;
}

export interface ToolApprovalPolicy {
  required: boolean;
  reason: string;
  expiresAfterMs?: number;
  approverRoles?: ('admin' | 'owner' | 'member')[];
}

export interface ToolHandlerContext {
  organizationId: string;
  runId: string;
  traceId: string;
  employeeId: string;
  signal?: AbortSignal;
}

export interface RegisteredTool {
  id: string;
  name: string;
  description: string;
  version: string;
  category: ToolCategory;
  permissions: ToolPermissionSpec;
  approvalPolicy: ToolApprovalPolicy;
  timeoutMs: number;
  retryPolicy: ToolRetryPolicy;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  handler: BaseToolHandler;
  enabled: boolean;
}

export type RegisteredToolInput = Omit<RegisteredTool, 'handler'> & {
  handler?: BaseToolHandler;
};

export interface ToolRegistryListFilter {
  category?: ToolCategory;
  enabled?: boolean;
}

export const DEFAULT_READ_RETRY_POLICY: ToolRetryPolicy = {
  maxAttempts: 3,
  backoffMs: [200, 500, 1_000],
  retryableErrors: ['EXECUTION_TIMEOUT', 'EXECUTION_NETWORK', 'RATE_LIMITED'],
};

export const DEFAULT_WRITE_RETRY_POLICY: ToolRetryPolicy = {
  maxAttempts: 1,
  backoffMs: [],
  retryableErrors: [],
};

export const DEFAULT_READ_APPROVAL: ToolApprovalPolicy = {
  required: false,
  reason: 'Read-only operation',
};

export const DEFAULT_WRITE_APPROVAL: ToolApprovalPolicy = {
  required: true,
  reason: 'This operation modifies data or triggers an external action',
  expiresAfterMs: 300_000,
  approverRoles: ['admin', 'owner'],
};

export const DEFAULT_EXTERNAL_APPROVAL: ToolApprovalPolicy = {
  required: true,
  reason: 'This operation calls an external system',
  expiresAfterMs: 300_000,
  approverRoles: ['admin', 'owner', 'member'],
};
