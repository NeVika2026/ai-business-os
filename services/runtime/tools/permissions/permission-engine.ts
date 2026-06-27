import { createPermissionError } from '@/services/runtime/tools/permissions/permission-errors';
import type {
  PermissionCheckResult,
  PermissionContext,
  PermissionLevel,
  PermissionRuleDefinition,
} from '@/services/runtime/tools/permissions/permission-types';
import { checkEmployeePermission } from '@/services/runtime/tools/permissions/rules/employee';
import { checkOrganizationPermission } from '@/services/runtime/tools/permissions/rules/organization';
import { checkRolePermission } from '@/services/runtime/tools/permissions/rules/role';
import { checkUserPermission } from '@/services/runtime/tools/permissions/rules/user';

const PERMISSION_RULES: PermissionRuleDefinition[] = [
  { level: 'organization', evaluate: checkOrganizationPermission },
  { level: 'employee', evaluate: checkEmployeePermission },
  { level: 'role', evaluate: checkRolePermission },
  { level: 'user', evaluate: checkUserPermission },
];

const LEVEL_LABELS: Record<PermissionLevel, string> = {
  organization: 'organization',
  employee: 'employee',
  role: 'role',
  user: 'user',
};

function buildAllowedResult(): PermissionCheckResult {
  return {
    allowed: true,
    denied: false,
    reason: 'Allowed at organization, employee, role, and user levels',
  };
}

function buildDeniedResult(level: PermissionLevel, reason: string): PermissionCheckResult {
  return {
    allowed: false,
    denied: true,
    reason,
    failedLevel: level,
  };
}

export class PermissionEngine {
  check(context: PermissionContext): PermissionCheckResult {
    for (const rule of PERMISSION_RULES) {
      const result = rule.evaluate(context);

      if (!result.allowed) {
        return buildDeniedResult(rule.level, result.reason ?? 'Permission denied');
      }
    }

    return buildAllowedResult();
  }

  canExecute(context: PermissionContext): boolean {
    return this.check(context).allowed;
  }

  explain(context: PermissionContext): string {
    const result = this.check(context);

    if (result.allowed) {
      return result.reason;
    }

    const level = result.failedLevel ?? 'organization';
    return `Denied at ${LEVEL_LABELS[level]} level. ${result.reason}`;
  }

  assertCanExecute(context: PermissionContext): void {
    const result = this.check(context);

    if (!result.allowed) {
      throw createPermissionError(result.failedLevel ?? 'organization', result.reason);
    }
  }
}

export const permissionEngine = new PermissionEngine();
