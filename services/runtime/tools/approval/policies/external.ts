import type {
  ApprovalContext,
  ApprovalPolicyEvaluation,
} from '@/services/runtime/tools/approval/approval-types';
import type { ToolCategory } from '@/services/runtime/tools/tool-types';

const EXTERNAL_CATEGORIES = new Set<ToolCategory>(['communication', 'integrations', 'mcp', 'web']);

export function evaluateExternalPolicy(context: ApprovalContext): ApprovalPolicyEvaluation {
  const requiresApproval =
    EXTERNAL_CATEGORIES.has(context.category) || context.toolId.startsWith('mcp.');

  return {
    requiresApproval,
    reason: requiresApproval
      ? context.approvalPolicy.reason || 'External operations require explicit approval'
      : 'Internal operation does not require external approval',
  };
}
