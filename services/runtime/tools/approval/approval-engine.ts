import {
  ApprovalPolicyError,
  ApprovalRequiredError,
  InvalidApprovalTokenError,
} from '@/services/runtime/tools/approval/approval-errors';
import type {
  ApprovalCheckResult,
  ApprovalContext,
  ApprovalPolicyDefinition,
  ApprovalPolicyEvaluation,
  ApprovalPolicyName,
} from '@/services/runtime/tools/approval/approval-types';
import { evaluateAlwaysPolicy } from '@/services/runtime/tools/approval/policies/always';
import { evaluateExternalPolicy } from '@/services/runtime/tools/approval/policies/external';
import { evaluateFinancialPolicy } from '@/services/runtime/tools/approval/policies/financial';
import { evaluateNeverPolicy } from '@/services/runtime/tools/approval/policies/never';
import { evaluatePublishPolicy } from '@/services/runtime/tools/approval/policies/publish';
import { evaluateWritePolicy } from '@/services/runtime/tools/approval/policies/write';

const APPROVAL_POLICIES: Record<ApprovalPolicyName, ApprovalPolicyDefinition> = {
  always: { name: 'always', evaluate: evaluateAlwaysPolicy },
  never: { name: 'never', evaluate: evaluateNeverPolicy },
  write: { name: 'write', evaluate: evaluateWritePolicy },
  external: { name: 'external', evaluate: evaluateExternalPolicy },
  financial: { name: 'financial', evaluate: evaluateFinancialPolicy },
  publish: { name: 'publish', evaluate: evaluatePublishPolicy },
};

const FINANCIAL_PATTERNS = ['payment', 'invoice', 'billing', 'refund', 'charge'];
const PUBLISH_PATTERNS = ['.publish', '.post', 'webhook.post', 'notion.publish'];
const WRITE_SUFFIXES = ['.create', '.update', '.delete', '.send'];

function resolvePolicyName(context: ApprovalContext): ApprovalPolicyName {
  if (context.policyName) {
    return context.policyName;
  }

  if (!context.approvalPolicy.required) {
    return 'never';
  }

  const toolId = context.toolId.toLowerCase();

  if (FINANCIAL_PATTERNS.some((pattern) => toolId.includes(pattern))) {
    return 'financial';
  }

  if (PUBLISH_PATTERNS.some((pattern) => toolId.includes(pattern))) {
    return 'publish';
  }

  if (['communication', 'integrations', 'mcp', 'web'].includes(context.category)) {
    return 'external';
  }

  if (WRITE_SUFFIXES.some((suffix) => toolId.endsWith(suffix))) {
    return 'write';
  }

  return 'always';
}

function getPolicyDefinition(policyName: ApprovalPolicyName): ApprovalPolicyDefinition {
  const policy = APPROVAL_POLICIES[policyName];

  if (!policy) {
    throw new ApprovalPolicyError(`Unknown approval policy: ${policyName}`, policyName);
  }

  return policy;
}

function evaluatePolicy(context: ApprovalContext): ApprovalPolicyEvaluation & {
  policy: ApprovalPolicyName;
} {
  const policyName = resolvePolicyName(context);
  const policy = getPolicyDefinition(policyName);
  const evaluation = policy.evaluate(context);

  return {
    ...evaluation,
    policy: policyName,
  };
}

function isTokenExpired(expiresAt?: string): boolean {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() < Date.now();
}

function validateApprovalToken(context: ApprovalContext): {
  valid: boolean;
  reason?: string;
} {
  const token = context.approvalToken;

  if (!token) {
    return { valid: false, reason: 'Approval token is missing' };
  }

  if (!token.token.trim()) {
    return { valid: false, reason: 'Approval token value is empty' };
  }

  if (token.toolId !== context.toolId) {
    return {
      valid: false,
      reason: `Approval token tool mismatch: expected "${context.toolId}", got "${token.toolId}"`,
    };
  }

  if (!token.approvedBy?.trim()) {
    return { valid: false, reason: 'Approval token is missing approver identity' };
  }

  if (isTokenExpired(token.expiresAt)) {
    return { valid: false, reason: 'Approval token has expired' };
  }

  return { valid: true };
}

function buildApprovedResult(policy: ApprovalPolicyName, reason: string): ApprovalCheckResult {
  return {
    approved: true,
    requiresApproval: false,
    reason,
    policy,
  };
}

function buildPendingResult(policy: ApprovalPolicyName, reason: string): ApprovalCheckResult {
  return {
    approved: false,
    requiresApproval: true,
    reason,
    policy,
  };
}

export class ApprovalEngine {
  check(context: ApprovalContext): ApprovalCheckResult {
    const evaluation = evaluatePolicy(context);

    if (!evaluation.requiresApproval) {
      return buildApprovedResult(evaluation.policy, evaluation.reason);
    }

    if (context.alreadyApproved === true) {
      return buildApprovedResult(
        evaluation.policy,
        context.approvalPolicy.reason || 'Operation was already approved',
      );
    }

    if (context.approvalToken) {
      const tokenValidation = validateApprovalToken(context);

      if (tokenValidation.valid) {
        return buildApprovedResult(
          evaluation.policy,
          context.approvalPolicy.reason || 'Valid approval token provided',
        );
      }

      return {
        approved: false,
        requiresApproval: true,
        reason: tokenValidation.reason ?? 'Invalid approval token',
        policy: evaluation.policy,
      };
    }

    return buildPendingResult(evaluation.policy, evaluation.reason);
  }

  requiresApproval(context: ApprovalContext): boolean {
    return this.check(context).requiresApproval;
  }

  explain(context: ApprovalContext): string {
    const result = this.check(context);

    if (result.approved && !result.requiresApproval) {
      return `Approved.\n\nPolicy: ${result.policy}.\n\nReason:\n${result.reason}`;
    }

    return `Approval required.\n\nPolicy: ${result.policy}.\n\nReason:\n${result.reason}`;
  }

  assertApproved(context: ApprovalContext): void {
    const result = this.check(context);

    if (context.approvalToken && !result.approved) {
      throw new InvalidApprovalTokenError(result.reason);
    }

    if (result.requiresApproval && !result.approved) {
      throw new ApprovalRequiredError(result.reason, result.policy);
    }
  }
}

export const approvalEngine = new ApprovalEngine();
