import type { AutomationPolicy } from '@/services/runtime/orchestrator/automation/automation-policy';
import { requiresCommitApproval } from '@/services/runtime/orchestrator/automation/automation-policy';
import type {
  AutomationReport,
  AutomationReportStep,
  AutomationSession,
  AutomationStepState,
  AutomationStepStatus,
} from '@/services/runtime/orchestrator/automation/automation-types';

function toReportStep(step: AutomationStepState): AutomationReportStep {
  return {
    id: step.id,
    title: step.title,
    type: step.type,
    status: step.status,
    attempts: step.attempts,
    lastError: step.lastError,
  };
}

function findNextRunnableStep(steps: AutomationStepState[]): AutomationStepState | null {
  for (const step of steps) {
    if (step.status !== 'pending') {
      continue;
    }

    const depsMet = step.dependsOn.every((depId) => {
      const dep = steps.find((candidate) => candidate.id === depId);
      return dep?.status === 'completed';
    });

    if (depsMet) {
      return step;
    }
  }

  return null;
}

function resolveNextRecommendedAction(
  session: AutomationSession,
  policy: AutomationPolicy,
): string {
  const { plan, controllerStatus, pauseReason, stopReason } = session;

  if (controllerStatus === 'paused' && pauseReason) {
    return pauseReason;
  }

  if (controllerStatus === 'stopped' && stopReason) {
    return `Run stopped: ${stopReason}`;
  }

  if (controllerStatus === 'failed') {
    const failed = plan.steps.filter((step) => step.status === 'failed');
    if (failed.length > 0) {
      return `Fix failed step "${failed[0].title}" before continuing`;
    }

    return 'Review failures and restart the plan';
  }

  if (controllerStatus === 'completed') {
    return 'Plan completed. Review report and approve commit manually if required.';
  }

  const nextStep = findNextRunnableStep(plan.steps);

  if (!nextStep) {
    const blocked = plan.steps.filter((step) => step.status === 'blocked');
    if (blocked.length > 0) {
      return `Unblock dependency chain starting at "${blocked[0].title}"`;
    }

    return 'No runnable steps remain';
  }

  if (requiresCommitApproval(nextStep.type, policy)) {
    return `Review changes and approve commit for step "${nextStep.title}"`;
  }

  return `Execute next step: "${nextStep.title}" (${nextStep.type})`;
}

function countByStatus(steps: AutomationStepState[], status: AutomationStepStatus): number {
  return steps.filter((step) => step.status === status).length;
}

export function buildAutomationReport(
  session: AutomationSession,
  policy: AutomationPolicy,
): AutomationReport {
  const { plan } = session;

  const executedSteps = plan.steps.filter((step) => step.status === 'completed').map(toReportStep);

  const failedSteps = plan.steps.filter((step) => step.status === 'failed').map(toReportStep);

  const pendingSteps = plan.steps.filter((step) => step.status === 'pending').map(toReportStep);

  const blockedSteps = plan.steps.filter((step) => step.status === 'blocked').map(toReportStep);

  return {
    planId: plan.id,
    planTitle: plan.title,
    status: session.controllerStatus,
    executedSteps,
    failedSteps,
    pendingSteps,
    blockedSteps,
    nextRecommendedAction: resolveNextRecommendedAction(session, policy),
    stopReason: session.stopReason,
    pauseReason: session.pauseReason,
    stepsExecutedThisRun: session.stepsExecutedThisRun,
    currentStepId: plan.currentStepId,
  };
}

export function summarizeAutomationSession(session: AutomationSession): {
  completedStepCount: number;
  failedStepCount: number;
  pendingStepCount: number;
} {
  const { steps } = session.plan;

  return {
    completedStepCount: countByStatus(steps, 'completed'),
    failedStepCount: countByStatus(steps, 'failed'),
    pendingStepCount: countByStatus(steps, 'pending'),
  };
}
