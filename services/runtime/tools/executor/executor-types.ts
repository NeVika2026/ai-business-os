import type { ApprovalToken } from '@/services/runtime/tools/approval/approval-types';
import type {
  ToolApprovalPolicy,
  ToolCategory,
  ToolPermissionSpec,
} from '@/services/runtime/tools/tool-types';
import type { TenantScope, ToolCall, TraceContext, UUID } from '@/types/runtime/dto';

export interface ToolExecutionEmployee {
  id: UUID;
  roleTitle: string;
  permissions: Record<string, boolean>;
  enabledTools: string[];
}

export interface ToolExecution {
  call: ToolCall;
  scope: TenantScope;
  trace: TraceContext;
  employee: ToolExecutionEmployee;
  category?: ToolCategory;
  toolPermissions?: ToolPermissionSpec;
  approvalPolicy?: ToolApprovalPolicy;
  orgFeatures?: Record<string, boolean>;
  employeeActive?: boolean;
  alreadyApproved?: boolean;
  approvalToken?: ApprovalToken | null;
  requestMetadata?: Record<string, unknown>;
}

export interface ToolValidationResult {
  valid: boolean;
  errors: string[];
}

export const MOCK_TOOL_EXECUTED_AT = '2026-01-01T00:00:00.000Z';
