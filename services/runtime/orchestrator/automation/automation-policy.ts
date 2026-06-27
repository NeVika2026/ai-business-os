import type { AutomationStepType } from '@/services/runtime/orchestrator/automation/automation-types';

export interface AutomationPolicy {
  maxStepsPerRun: number;
  maxAttemptsPerStep: number;
  stopOnBuildFailure: boolean;
  stopOnLintFailure: boolean;
  requireApprovalBeforeCommit: boolean;
}

export const DEFAULT_AUTOMATION_POLICY: AutomationPolicy = {
  maxStepsPerRun: 10,
  maxAttemptsPerStep: 3,
  stopOnBuildFailure: true,
  stopOnLintFailure: true,
  requireApprovalBeforeCommit: true,
};

export function resolveStepMaxAttempts(
  stepMaxAttempts: number | undefined,
  policy: AutomationPolicy,
): number {
  if (stepMaxAttempts !== undefined && stepMaxAttempts > 0) {
    return stepMaxAttempts;
  }

  return policy.maxAttemptsPerStep;
}

export function shouldStopOnStepFailure(
  stepType: AutomationStepType,
  policy: AutomationPolicy,
): boolean {
  if (stepType === 'lint' && policy.stopOnLintFailure) {
    return true;
  }

  if (stepType === 'build' && policy.stopOnBuildFailure) {
    return true;
  }

  return false;
}

export function requiresCommitApproval(
  stepType: AutomationStepType,
  policy: AutomationPolicy,
): boolean {
  return stepType === 'commit' && policy.requireApprovalBeforeCommit;
}

export function hasExceededMaxSteps(stepsExecuted: number, policy: AutomationPolicy): boolean {
  return stepsExecuted >= policy.maxStepsPerRun;
}

export function hasExceededMaxAttempts(attempts: number, maxAttempts: number): boolean {
  return attempts >= maxAttempts;
}
