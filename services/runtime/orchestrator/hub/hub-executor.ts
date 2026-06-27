import type { AutomationPlanInput } from '@/services/runtime/orchestrator/automation/automation-types';
import type { HubExecutionPhase } from '@/services/runtime/orchestrator/hub/hub-types';
import type { RunnerRunResult } from '@/services/runtime/orchestrator/runner/runtime-runner-types';

export function mapRunnerToImplementOutcome(
  runnerResult: RunnerRunResult | null,
): 'success' | 'failure' {
  if (!runnerResult) {
    return 'success';
  }

  return runnerResult.finished ? 'success' : 'failure';
}

export function resolveHubPhase(input: {
  runnerResult: RunnerRunResult | null;
  automationStatus: string;
  skipRuntime: boolean;
}): HubExecutionPhase {
  if (input.skipRuntime && input.automationStatus === 'running') {
    return 'automation';
  }

  if (!input.skipRuntime && !input.runnerResult) {
    return 'runtime';
  }

  if (input.automationStatus === 'paused') {
    return 'paused';
  }

  if (input.automationStatus === 'completed') {
    return 'completed';
  }

  if (input.automationStatus === 'failed' || input.automationStatus === 'stopped') {
    return 'failed';
  }

  return 'automation';
}

export function buildHubPlanWithOutcome(
  plan: AutomationPlanInput,
  outcome: 'success' | 'failure',
): AutomationPlanInput {
  return {
    ...plan,
    steps: plan.steps.map((step) =>
      step.type === 'implement'
        ? {
            ...step,
            outcome,
          }
        : step,
    ),
  };
}
