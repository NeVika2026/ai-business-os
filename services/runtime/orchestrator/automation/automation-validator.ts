import { AutomationValidationError } from '@/services/runtime/orchestrator/automation/automation-errors';
import type {
  AutomationPlanInput,
  AutomationStepInput,
  AutomationStepType,
} from '@/services/runtime/orchestrator/automation/automation-types';

const VALID_STEP_TYPES: AutomationStepType[] = [
  'implement',
  'lint',
  'build',
  'commit',
  'validate',
  'custom',
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateStep(step: AutomationStepInput, index: number): void {
  if (!isNonEmptyString(step.id)) {
    throw new AutomationValidationError(`steps[${index}].id is required`);
  }

  if (!isNonEmptyString(step.title)) {
    throw new AutomationValidationError(`steps[${index}].title is required`);
  }

  if (!VALID_STEP_TYPES.includes(step.type)) {
    throw new AutomationValidationError(`steps[${index}].type is invalid`);
  }

  if (step.dependsOn !== undefined) {
    if (!Array.isArray(step.dependsOn)) {
      throw new AutomationValidationError(`steps[${index}].dependsOn must be an array`);
    }

    for (const dep of step.dependsOn) {
      if (!isNonEmptyString(dep)) {
        throw new AutomationValidationError(`steps[${index}].dependsOn contains invalid id`);
      }
    }
  }

  if (step.maxAttempts !== undefined) {
    if (!Number.isInteger(step.maxAttempts) || step.maxAttempts <= 0) {
      throw new AutomationValidationError(`steps[${index}].maxAttempts must be a positive integer`);
    }
  }

  if (step.outcome !== undefined && step.outcome !== 'success' && step.outcome !== 'failure') {
    throw new AutomationValidationError(`steps[${index}].outcome must be success or failure`);
  }
}

function detectDependencyCycle(steps: AutomationStepInput[]): void {
  const stepIds = new Set(steps.map((step) => step.id));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const depsById = new Map<string, string[]>(steps.map((step) => [step.id, step.dependsOn ?? []]));

  function visit(stepId: string): void {
    if (visited.has(stepId)) {
      return;
    }

    if (visiting.has(stepId)) {
      throw new AutomationValidationError(`dependency cycle detected at step: ${stepId}`);
    }

    visiting.add(stepId);

    for (const depId of depsById.get(stepId) ?? []) {
      if (!stepIds.has(depId)) {
        throw new AutomationValidationError(`step ${stepId} depends on unknown step: ${depId}`);
      }

      visit(depId);
    }

    visiting.delete(stepId);
    visited.add(stepId);
  }

  for (const step of steps) {
    visit(step.id);
  }
}

export function validateAutomationPlan(plan: AutomationPlanInput): void {
  if (!plan || typeof plan !== 'object') {
    throw new AutomationValidationError('plan must be an object');
  }

  if (!isNonEmptyString(plan.id)) {
    throw new AutomationValidationError('plan.id is required');
  }

  if (!isNonEmptyString(plan.title)) {
    throw new AutomationValidationError('plan.title is required');
  }

  if (!Array.isArray(plan.steps) || plan.steps.length === 0) {
    throw new AutomationValidationError('plan.steps must be a non-empty array');
  }

  const ids = new Set<string>();

  plan.steps.forEach((step, index) => {
    validateStep(step, index);

    if (ids.has(step.id)) {
      throw new AutomationValidationError(`duplicate step id: ${step.id}`);
    }

    ids.add(step.id);
  });

  detectDependencyCycle(plan.steps);
}
