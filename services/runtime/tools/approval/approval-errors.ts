import type { ApprovalPolicyName } from '@/services/runtime/tools/approval/approval-types';

export class ApprovalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApprovalError';
  }
}

export class ApprovalRequiredError extends ApprovalError {
  constructor(
    message: string,
    public readonly policy: ApprovalPolicyName,
  ) {
    super(message);
    this.name = 'ApprovalRequiredError';
  }
}

export class InvalidApprovalTokenError extends ApprovalError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidApprovalTokenError';
  }
}

export class ApprovalPolicyError extends ApprovalError {
  constructor(
    message: string,
    public readonly policy?: ApprovalPolicyName,
  ) {
    super(message);
    this.name = 'ApprovalPolicyError';
  }
}
