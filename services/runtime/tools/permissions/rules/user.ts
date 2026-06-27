import type {
  PermissionContext,
  PermissionRuleResult,
} from '@/services/runtime/tools/permissions/permission-types';
import type { ToolCategory } from '@/services/runtime/tools/tool-types';

const USER_REQUIRED_CATEGORIES = new Set<ToolCategory>(['communication', 'mcp', 'integrations']);

const WRITE_TOOL_SUFFIXES = ['.create', '.update', '.delete', '.send'];

function isWriteTool(toolId: string): boolean {
  return WRITE_TOOL_SUFFIXES.some((suffix) => toolId.endsWith(suffix)) || toolId === 'mcp.call';
}

export function checkUserPermission(context: PermissionContext): PermissionRuleResult {
  const requiresUser =
    USER_REQUIRED_CATEGORIES.has(context.category) ||
    isWriteTool(context.toolId) ||
    context.permissions.requires_user_context === true;

  if (requiresUser && !context.userId) {
    return {
      allowed: false,
      reason: `Tool "${context.toolId}" requires an authenticated user context`,
    };
  }

  if (context.userId && context.permissions.user_tool_access === false) {
    return {
      allowed: false,
      reason: 'User is not allowed to execute tools for this organization',
    };
  }

  return { allowed: true };
}
