import type { ApprovalContext } from '@/services/runtime/tools/approval/approval-types';
import type { PermissionContext } from '@/services/runtime/tools/permissions/permission-types';
import type { ToolExecution } from '@/services/runtime/tools/executor/executor-types';
import {
  DEFAULT_READ_APPROVAL,
  type ToolApprovalPolicy,
  type ToolCategory,
} from '@/services/runtime/tools/tool-types';

function deriveCategoryFromToolId(toolId: string): ToolCategory {
  const prefix = toolId.split('.')[0]?.toLowerCase();

  switch (prefix) {
    case 'crm':
      return 'crm';
    case 'knowledge':
      return 'knowledge';
    case 'email':
    case 'telegram':
      return 'communication';
    case 'web':
      return 'web';
    case 'runtime':
      return 'system';
    case 'mcp':
      return 'mcp';
    default:
      return 'system';
  }
}

function deriveApprovalPolicy(toolId: string): ToolApprovalPolicy {
  const writeSuffixes = ['.create', '.update', '.delete', '.send'];
  const requiresApproval = writeSuffixes.some((suffix) => toolId.endsWith(suffix));

  if (requiresApproval) {
    return {
      required: true,
      reason: 'Write or external operations require explicit approval',
    };
  }

  return DEFAULT_READ_APPROVAL;
}

export function buildPermissionContext(execution: ToolExecution): PermissionContext {
  const toolId = execution.call.name;

  return {
    organizationId: execution.scope.organizationId,
    employeeId: execution.employee.id,
    role: execution.employee.roleTitle,
    userId: execution.scope.userId,
    toolId,
    category: execution.category ?? deriveCategoryFromToolId(toolId),
    permissions: execution.employee.permissions,
    enabledTools: execution.employee.enabledTools,
    toolPermissions: execution.toolPermissions ?? {
      requiredFlags: [],
      categoryDefault: true,
    },
    orgFeatures: execution.orgFeatures,
    employeeActive: execution.employeeActive,
  };
}

export function buildApprovalContext(execution: ToolExecution): ApprovalContext {
  const toolId = execution.call.name;

  return {
    organizationId: execution.scope.organizationId,
    employeeId: execution.employee.id,
    role: execution.employee.roleTitle,
    userId: execution.scope.userId,
    toolId,
    category: execution.category ?? deriveCategoryFromToolId(toolId),
    approvalPolicy: execution.approvalPolicy ?? deriveApprovalPolicy(toolId),
    alreadyApproved: execution.alreadyApproved,
    approvalToken: execution.approvalToken,
    requestMetadata: execution.requestMetadata,
  };
}

export { deriveCategoryFromToolId, deriveApprovalPolicy };
