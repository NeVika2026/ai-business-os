import type {
  PermissionContext,
  PermissionRuleResult,
} from '@/services/runtime/tools/permissions/permission-types';
import type { ToolCategory } from '@/services/runtime/tools/tool-types';

const EXTERNAL_CATEGORIES = new Set<ToolCategory>(['communication', 'integrations', 'mcp', 'web']);

function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

function isOrgFeatureEnabled(features: Record<string, boolean> | undefined, flag: string): boolean {
  return features?.[flag] === true;
}

export function checkOrganizationPermission(context: PermissionContext): PermissionRuleResult {
  if (!isNonEmptyString(context.organizationId)) {
    return {
      allowed: false,
      reason: 'Organization id is required for tool execution',
    };
  }

  const orgFeatureFlag = context.toolPermissions.orgFeatureFlag;

  if (orgFeatureFlag && !isOrgFeatureEnabled(context.orgFeatures, orgFeatureFlag)) {
    return {
      allowed: false,
      reason: `Organization feature "${orgFeatureFlag}" is not enabled`,
    };
  }

  if (
    EXTERNAL_CATEGORIES.has(context.category) &&
    !isOrgFeatureEnabled(context.orgFeatures, 'tools_external_enabled')
  ) {
    return {
      allowed: false,
      reason: `Organization has not enabled external tools for category "${context.category}"`,
    };
  }

  return { allowed: true };
}
