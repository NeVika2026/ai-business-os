import type {
  PermissionContext,
  PermissionRuleResult,
} from '@/services/runtime/tools/permissions/permission-types';

function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

export function checkEmployeePermission(context: PermissionContext): PermissionRuleResult {
  if (!isNonEmptyString(context.employeeId)) {
    return {
      allowed: false,
      reason: 'Employee id is required for tool execution',
    };
  }

  if (context.employeeActive === false) {
    return {
      allowed: false,
      reason: 'AI employee is inactive',
    };
  }

  if (!context.enabledTools.includes(context.toolId)) {
    return {
      allowed: false,
      reason: `Tool "${context.toolId}" is not enabled for this employee`,
    };
  }

  const missingFlags = context.toolPermissions.requiredFlags.filter(
    (flag) => context.permissions[flag] !== true,
  );

  if (missingFlags.length > 0) {
    return {
      allowed: false,
      reason: `Missing employee permissions: ${missingFlags.join(', ')}`,
    };
  }

  return { allowed: true };
}
