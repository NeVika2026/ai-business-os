import type {
  ApprovalContext,
  ApprovalPolicyEvaluation,
} from '@/services/runtime/tools/approval/approval-types';

export function evaluateAlwaysPolicy(context: ApprovalContext): ApprovalPolicyEvaluation {
  return {
    requiresApproval: true,
    reason: context.approvalPolicy.reason || 'This operation requires explicit approval',
  };
}
