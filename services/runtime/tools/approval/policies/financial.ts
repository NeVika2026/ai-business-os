import type {
  ApprovalContext,
  ApprovalPolicyEvaluation,
} from '@/services/runtime/tools/approval/approval-types';

const FINANCIAL_PATTERNS = ['payment', 'invoice', 'billing', 'refund', 'charge'];

function isFinancialTool(toolId: string): boolean {
  const normalized = toolId.toLowerCase();
  return FINANCIAL_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function evaluateFinancialPolicy(context: ApprovalContext): ApprovalPolicyEvaluation {
  const requiresApproval = isFinancialTool(context.toolId);

  return {
    requiresApproval,
    reason: requiresApproval
      ? context.approvalPolicy.reason || 'Financial operations require explicit approval'
      : 'Non-financial operation does not require financial approval',
  };
}
