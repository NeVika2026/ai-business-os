import type { ToolApprovalPolicy, ToolCategory } from '@/services/runtime/tools/tool-types';

export type ApprovalPolicyName =
  | 'always'
  | 'never'
  | 'write'
  | 'external'
  | 'financial'
  | 'publish';

export interface ApprovalToken {
  token: string;
  toolId: string;
  runId?: string;
  approvedBy?: string;
  approvedAt?: string;
  expiresAt?: string;
}

export interface ApprovalContext {
  organizationId: string;
  employeeId: string;
  role: string;
  userId?: string | null;
  toolId: string;
  category: ToolCategory;
  approvalPolicy: ToolApprovalPolicy;
  policyName?: ApprovalPolicyName;
  alreadyApproved?: boolean;
  approvalToken?: ApprovalToken | null;
  requestMetadata?: Record<string, unknown>;
}

export interface ApprovalCheckResult {
  approved: boolean;
  requiresApproval: boolean;
  reason: string;
  policy: ApprovalPolicyName;
}

export interface ApprovalPolicyEvaluation {
  requiresApproval: boolean;
  reason: string;
}

export type ApprovalPolicyEvaluator = (context: ApprovalContext) => ApprovalPolicyEvaluation;

export interface ApprovalPolicyDefinition {
  name: ApprovalPolicyName;
  evaluate: ApprovalPolicyEvaluator;
}
