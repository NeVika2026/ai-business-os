import type { ToolCategory, ToolPermissionSpec } from '@/services/runtime/tools/tool-types';

export type PermissionLevel = 'organization' | 'employee' | 'role' | 'user';

export interface PermissionContext {
  organizationId: string;
  employeeId: string;
  role: string;
  userId?: string | null;
  toolId: string;
  category: ToolCategory;
  permissions: Record<string, boolean>;
  enabledTools: string[];
  toolPermissions: ToolPermissionSpec;
  orgFeatures?: Record<string, boolean>;
  employeeActive?: boolean;
}

export interface PermissionCheckResult {
  allowed: boolean;
  denied: boolean;
  reason: string;
  failedLevel?: PermissionLevel;
}

export interface PermissionRuleResult {
  allowed: boolean;
  reason?: string;
}

export type PermissionRule = (context: PermissionContext) => PermissionRuleResult;

export interface PermissionRuleDefinition {
  level: PermissionLevel;
  evaluate: PermissionRule;
}
