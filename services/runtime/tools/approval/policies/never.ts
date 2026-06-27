import type { ApprovalPolicyEvaluation } from '@/services/runtime/tools/approval/approval-types';

export function evaluateNeverPolicy(): ApprovalPolicyEvaluation {
  return {
    requiresApproval: false,
    reason: 'Approval is not required for this operation',
  };
}
