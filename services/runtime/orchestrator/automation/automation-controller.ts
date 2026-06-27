import {
  AutomationInvalidStateError,
  AutomationNotStartedError,
} from '@/services/runtime/orchestrator/automation/automation-errors';
import {
  DEFAULT_AUTOMATION_POLICY,
  hasExceededMaxAttempts,
  hasExceededMaxSteps,
  requiresCommitApproval,
  resolveStepMaxAttempts,
  shouldStopOnStepFailure,
  type AutomationPolicy,
} from '@/services/runtime/orchestrator/automation/automation-policy';
import {
  buildAutomationReport,
  summarizeAutomationSession,
} from '@/services/runtime/orchestrator/automation/automation-report';
import type {
  AutomationNextResult,
  AutomationPlanInput,
  AutomationPlanState,
  AutomationProvider,
  AutomationReport,
  AutomationRunUntilStopResult,
  AutomationSession,
  AutomationStatus,
  AutomationStatusView,
  AutomationStepState,
  AutomationStepStatus,
} from '@/services/runtime/orchestrator/automation/automation-types';
import { validateAutomationPlan } from '@/services/runtime/orchestrator/automation/automation-validator';
import {
  createMockAutomationProvider,
  mockAutomationProvider,
} from '@/services/runtime/orchestrator/automation/providers/mock-automation-provider';

function createPlanState(plan: AutomationPlanInput, policy: AutomationPolicy): AutomationPlanState {
  return {
    id: plan.id,
    title: plan.title,
    currentStepId: null,
    status: 'running',
    steps: plan.steps.map((step) => ({
      id: step.id,
      title: step.title,
      type: step.type,
      status: 'pending',
      dependsOn: [...(step.dependsOn ?? [])],
      attempts: 0,
      maxAttempts: resolveStepMaxAttempts(step.maxAttempts, policy),
      outcome: step.outcome ?? null,
      lastError: null,
      completedAt: null,
    })),
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

function markBlockedDependents(steps: AutomationStepState[], failedStepId: string): void {
  for (const step of steps) {
    if (step.status !== 'pending') {
      continue;
    }

    if (step.dependsOn.includes(failedStepId)) {
      step.status = 'blocked';
      step.lastError = `blocked by failed dependency: ${failedStepId}`;
      markBlockedDependents(steps, step.id);
    }
  }
}

function allStepsTerminal(steps: AutomationStepState[]): boolean {
  return steps.every((step) => ['completed', 'failed', 'skipped', 'blocked'].includes(step.status));
}

function allStepsCompleted(steps: AutomationStepState[]): boolean {
  return steps.every((step) => step.status === 'completed' || step.status === 'skipped');
}

function simulateStepOutcome(step: AutomationStepState): boolean {
  if (step.outcome === 'failure') {
    return false;
  }

  return true;
}

/**
 * Per-plan automation controller. Each automation run should create its own instance
 * via createAutomationController() so session state is not shared across concurrent runs.
 */
export class AutomationController {
  private activePlanId: string | null = null;

  constructor(
    private readonly provider: AutomationProvider,
    private readonly policy: AutomationPolicy = DEFAULT_AUTOMATION_POLICY,
  ) {}

  start(plan: AutomationPlanInput): AutomationStatusView {
    validateAutomationPlan(plan);

    const now = new Date().toISOString();
    this.activePlanId = plan.id;

    const session: AutomationSession = {
      plan: createPlanState(plan, this.policy),
      controllerStatus: 'running',
      stepsExecutedThisRun: 0,
      pauseReason: null,
      stopReason: null,
      startedAt: now,
      updatedAt: now,
      stoppedAt: null,
    };

    this.provider.save(session);
    return this.status();
  }

  next(): AutomationNextResult {
    const session = this.requireMutableSession();

    if (hasExceededMaxSteps(session.stepsExecutedThisRun, this.policy)) {
      return this.finalizeSession(session, 'stopped', 'max_steps_per_run_exceeded');
    }

    const nextStep = findNextRunnableStep(session.plan.steps);

    if (!nextStep) {
      if (allStepsCompleted(session.plan.steps)) {
        return this.finalizeSession(session, 'completed', null);
      }

      if (allStepsTerminal(session.plan.steps)) {
        const hasFailed = session.plan.steps.some((step) => step.status === 'failed');
        return this.finalizeSession(
          session,
          hasFailed ? 'failed' : 'stopped',
          hasFailed ? 'step_failure' : 'no_runnable_steps',
        );
      }

      return {
        executed: false,
        stepId: null,
        stepStatus: null,
        controllerStatus: session.controllerStatus,
        stopped: false,
        reason: 'waiting_for_dependencies',
      };
    }

    if (requiresCommitApproval(nextStep.type, this.policy)) {
      session.plan.currentStepId = nextStep.id;
      session.controllerStatus = 'paused';
      session.pauseReason = `Approval required before commit step "${nextStep.title}"`;
      session.updatedAt = new Date().toISOString();
      this.provider.update(session);

      return {
        executed: false,
        stepId: nextStep.id,
        stepStatus: nextStep.status,
        controllerStatus: 'paused',
        stopped: true,
        reason: session.pauseReason,
      };
    }

    return this.executeStep(session, nextStep);
  }

  runUntilStop(): AutomationRunUntilStopResult {
    this.requireMutableSession();

    let stopped = false;
    let reason: string | null = null;

    while (!stopped) {
      const current = this.requireSession();

      if (hasExceededMaxSteps(current.stepsExecutedThisRun, this.policy)) {
        this.finalizeSession(current, 'stopped', 'max_steps_per_run_exceeded');
        stopped = true;
        reason = 'max_steps_per_run_exceeded';
        break;
      }

      if (current.controllerStatus !== 'running') {
        stopped = true;
        reason = current.stopReason ?? current.pauseReason;
        break;
      }

      const result = this.next();

      if (result.stopped || result.controllerStatus !== 'running') {
        stopped = true;
        reason = result.reason;
        break;
      }

      if (!result.executed && result.reason === 'waiting_for_dependencies') {
        stopped = true;
        reason = result.reason;
        break;
      }
    }

    const finalSession = this.requireSession();

    return {
      stepsExecuted: finalSession.stepsExecutedThisRun,
      controllerStatus: finalSession.controllerStatus,
      stopped,
      reason,
    };
  }

  pause(reason: string): AutomationStatusView {
    const session = this.requireMutableSession();

    session.controllerStatus = 'paused';
    session.pauseReason = reason.trim().length > 0 ? reason : 'paused_by_user';
    session.updatedAt = new Date().toISOString();
    session.plan.status = 'paused';

    this.provider.update(session);
    return this.status();
  }

  resume(): AutomationStatusView {
    const session = this.requireSession();

    if (session.controllerStatus !== 'paused') {
      throw new AutomationInvalidStateError('controller is not paused');
    }

    session.controllerStatus = 'running';
    session.pauseReason = null;
    session.updatedAt = new Date().toISOString();
    session.plan.status = 'running';

    this.provider.update(session);
    return this.status();
  }

  stop(reason: string): AutomationStatusView {
    const session = this.requireSession();

    session.controllerStatus = 'stopped';
    session.stopReason = reason.trim().length > 0 ? reason : 'stopped_by_user';
    session.stoppedAt = new Date().toISOString();
    session.updatedAt = session.stoppedAt;
    session.plan.status = 'stopped';

    this.provider.update(session);
    return this.status();
  }

  status(): AutomationStatusView {
    const session = this.requireSession();
    const summary = summarizeAutomationSession(session);

    return {
      status: session.controllerStatus,
      planId: session.plan.id,
      planTitle: session.plan.title,
      currentStepId: session.plan.currentStepId,
      stepsExecutedThisRun: session.stepsExecutedThisRun,
      pauseReason: session.pauseReason,
      stopReason: session.stopReason,
      completedStepCount: summary.completedStepCount,
      failedStepCount: summary.failedStepCount,
      pendingStepCount: summary.pendingStepCount,
    };
  }

  report(): AutomationReport {
    return buildAutomationReport(this.requireSession(), this.policy);
  }

  reset(): void {
    this.activePlanId = null;
    this.provider.reset?.();
  }

  private executeStep(session: AutomationSession, step: AutomationStepState): AutomationNextResult {
    const now = new Date().toISOString();
    step.status = 'running';
    step.attempts += 1;
    session.plan.currentStepId = step.id;
    session.updatedAt = now;

    const success = simulateStepOutcome(step);

    if (success) {
      step.status = 'completed';
      step.lastError = null;
      step.completedAt = now;
      session.stepsExecutedThisRun += 1;

      if (allStepsCompleted(session.plan.steps)) {
        return this.finalizeSession(session, 'completed', null, step.id, step.status);
      }

      session.controllerStatus = 'running';
      this.provider.update(session);

      return {
        executed: true,
        stepId: step.id,
        stepStatus: step.status,
        controllerStatus: session.controllerStatus,
        stopped: false,
        reason: null,
      };
    }

    step.lastError = `${step.type} step failed (attempt ${step.attempts}/${step.maxAttempts})`;

    if (!hasExceededMaxAttempts(step.attempts, step.maxAttempts)) {
      step.status = 'pending';
      session.stepsExecutedThisRun += 1;
      session.controllerStatus = 'running';
      this.provider.update(session);

      return {
        executed: true,
        stepId: step.id,
        stepStatus: step.status,
        controllerStatus: session.controllerStatus,
        stopped: false,
        reason: step.lastError,
      };
    }

    step.status = 'failed';
    markBlockedDependents(session.plan.steps, step.id);
    session.stepsExecutedThisRun += 1;

    if (shouldStopOnStepFailure(step.type, this.policy)) {
      const stopReason = `${step.type}_failure`;
      return this.finalizeSession(session, 'failed', stopReason, step.id, step.status);
    }

    if (allStepsTerminal(session.plan.steps)) {
      return this.finalizeSession(session, 'failed', 'step_failure', step.id, step.status);
    }

    session.controllerStatus = 'running';
    this.provider.update(session);

    return {
      executed: true,
      stepId: step.id,
      stepStatus: step.status,
      controllerStatus: session.controllerStatus,
      stopped: false,
      reason: step.lastError,
    };
  }

  private finalizeSession(
    session: AutomationSession,
    status: AutomationStatus,
    reason: string | null,
    stepId: string | null = null,
    stepStatus: AutomationStepStatus | null = null,
  ): AutomationNextResult {
    session.controllerStatus = status;
    session.plan.status = status;
    session.updatedAt = new Date().toISOString();

    if (status === 'paused') {
      session.pauseReason = reason;
    } else if (status === 'stopped' || status === 'failed') {
      session.stopReason = reason;
      session.stoppedAt = session.updatedAt;
    } else if (status === 'completed') {
      session.stopReason = null;
      session.stoppedAt = session.updatedAt;
    }

    this.provider.update(session);

    return {
      executed: stepId !== null,
      stepId,
      stepStatus,
      controllerStatus: status,
      stopped: status !== 'running',
      reason,
    };
  }

  private requireSession(): AutomationSession {
    const planId = this.requireActivePlanId();
    const session = this.provider.get(planId);

    if (!session) {
      throw new AutomationNotStartedError();
    }

    return session;
  }

  private requireMutableSession(): AutomationSession {
    const session = this.requireSession();

    if (session.controllerStatus === 'completed') {
      throw new AutomationInvalidStateError('plan is already completed');
    }

    if (session.controllerStatus === 'stopped') {
      throw new AutomationInvalidStateError('controller is stopped');
    }

    if (session.controllerStatus === 'failed') {
      throw new AutomationInvalidStateError('controller has failed');
    }

    if (session.controllerStatus === 'paused') {
      throw new AutomationInvalidStateError('controller is paused — call resume() first');
    }

    return session;
  }

  private requireActivePlanId(): string {
    if (!this.activePlanId) {
      throw new AutomationNotStartedError();
    }

    return this.activePlanId;
  }
}

export function createAutomationController(
  options?: AutomationControllerOptions,
): AutomationController {
  const provider = options?.provider ?? mockAutomationProvider;
  const policy = options?.policy ?? DEFAULT_AUTOMATION_POLICY;

  return new AutomationController(provider, policy);
}

/** Default dev/test singleton. Do not use for concurrent production automation runs. */
export const automationController = createAutomationController();

export { createMockAutomationProvider, mockAutomationProvider };

export interface AutomationControllerOptions {
  provider?: AutomationProvider;
  policy?: AutomationPolicy;
}
