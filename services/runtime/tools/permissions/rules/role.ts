import type {
  PermissionContext,
  PermissionRuleResult,
} from '@/services/runtime/tools/permissions/permission-types';

const WRITE_TOOL_SUFFIXES = ['.create', '.update', '.delete', '.send'];

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

function isWriteTool(toolId: string): boolean {
  return WRITE_TOOL_SUFFIXES.some((suffix) => toolId.endsWith(suffix)) || toolId === 'mcp.call';
}

function formatRequiredAccess(context: PermissionContext): string {
  if (context.toolPermissions.requiredFlags.length > 0) {
    return context.toolPermissions.requiredFlags.join(', ');
  }

  if (isWriteTool(context.toolId)) {
    return `${context.category}.write`;
  }

  return `${context.category}.read`;
}

export function checkRolePermission(context: PermissionContext): PermissionRuleResult {
  const role = normalizeRole(context.role);
  const { toolPermissions } = context;

  if (toolPermissions.deniedRoles?.some((deniedRole) => normalizeRole(deniedRole) === role)) {
    return {
      allowed: false,
      reason: `Role "${context.role}" is denied for tool "${context.toolId}"`,
    };
  }

  if (
    toolPermissions.allowedRoles &&
    toolPermissions.allowedRoles.length > 0 &&
    !toolPermissions.allowedRoles.some((allowedRole) => normalizeRole(allowedRole) === role)
  ) {
    return {
      allowed: false,
      reason: `Role "${context.role}" is not in the allowed roles list`,
    };
  }

  if (role === 'viewer' && isWriteTool(context.toolId)) {
    return {
      allowed: false,
      reason: `Tool requires ${formatRequiredAccess(context)}. Current role: ${context.role}`,
    };
  }

  if (role === 'support' && context.category === 'crm' && isWriteTool(context.toolId)) {
    return {
      allowed: false,
      reason: `Support role cannot execute CRM write tools. Tool requires ${formatRequiredAccess(context)}. Current role: ${context.role}`,
    };
  }

  return { allowed: true };
}
