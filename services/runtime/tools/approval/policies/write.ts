import type {
  ApprovalContext,
  ApprovalPolicyEvaluation,
} from '@/services/runtime/tools/approval/approval-types';

const WRITE_SUFFIXES = ['.create', '.update', '.delete'];

function isWriteTool(toolId: string): boolean {
  return WRITE_SUFFIXES.some((suffix) => toolId.endsWith(suffix)) || toolId.endsWith('.send');
}

export function evaluateWritePolicy(context: ApprovalContext): ApprovalPolicyEvaluation {
  const requiresApproval = isWriteTool(context.toolId);

  return {
    requiresApproval,
    reason: requiresApproval
      ? context.approvalPolicy.reason || 'Write operations require explicit approval'
      : 'Read operation does not require approval',
  };
}
