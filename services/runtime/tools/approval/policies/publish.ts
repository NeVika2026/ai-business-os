import type {
  ApprovalContext,
  ApprovalPolicyEvaluation,
} from '@/services/runtime/tools/approval/approval-types';

const PUBLISH_PATTERNS = ['.publish', '.post', 'webhook.post', 'notion.publish'];

function isPublishTool(toolId: string): boolean {
  const normalized = toolId.toLowerCase();
  return PUBLISH_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function evaluatePublishPolicy(context: ApprovalContext): ApprovalPolicyEvaluation {
  const requiresApproval = isPublishTool(context.toolId);

  return {
    requiresApproval,
    reason: requiresApproval
      ? context.approvalPolicy.reason || 'Publishing operations require explicit approval'
      : 'Non-publish operation does not require publish approval',
  };
}
