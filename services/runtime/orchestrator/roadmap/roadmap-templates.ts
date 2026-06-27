import type { AutomationStepInput } from '@/services/runtime/orchestrator/automation/automation-types';
import type {
  RoadmapSprintInput,
  SprintCompileOptions,
} from '@/services/runtime/orchestrator/roadmap/roadmap-types';

export const STANDARD_SPRINT_STEP_ORDER = [
  'implement',
  'lint',
  'build',
  'validate',
  'commit',
] as const;

export type StandardSprintStepKind = (typeof STANDARD_SPRINT_STEP_ORDER)[number];

function stepId(prefix: string, sprintId: string, kind: string): string {
  return `${prefix}${sprintId}-${kind}`;
}

export function buildStandardSprintSteps(
  sprint: RoadmapSprintInput,
  options?: SprintCompileOptions,
): AutomationStepInput[] {
  const prefix = options?.prefix ?? '';
  const steps: AutomationStepInput[] = [];
  let previousStepId: string | null = null;

  const implementId = stepId(prefix, sprint.id, 'implement');
  steps.push({
    id: implementId,
    title: `${sprint.code}: ${sprint.title} — implement`,
    type: 'implement',
    outcome: options?.implementOutcome,
  });
  previousStepId = implementId;

  if (!sprint.skipLint) {
    const lintId = stepId(prefix, sprint.id, 'lint');
    steps.push({
      id: lintId,
      title: `${sprint.code}: lint`,
      type: 'lint',
      dependsOn: previousStepId ? [previousStepId] : [],
    });
    previousStepId = lintId;
  }

  if (!sprint.skipBuild) {
    const buildId = stepId(prefix, sprint.id, 'build');
    steps.push({
      id: buildId,
      title: `${sprint.code}: build`,
      type: 'build',
      dependsOn: previousStepId ? [previousStepId] : [],
    });
    previousStepId = buildId;
  }

  const includeValidate = sprint.includeValidateStep ?? false;

  if (includeValidate) {
    const validateId = stepId(prefix, sprint.id, 'validate');
    steps.push({
      id: validateId,
      title: `${sprint.code}: validate`,
      type: 'validate',
      dependsOn: previousStepId ? [previousStepId] : [],
    });
    previousStepId = validateId;
  }

  const includeCommit = sprint.includeCommitStep ?? true;

  if (includeCommit) {
    const commitId = stepId(prefix, sprint.id, 'commit');
    steps.push({
      id: commitId,
      title: `${sprint.code}: commit (approval gate)`,
      type: 'commit',
      dependsOn: previousStepId ? [previousStepId] : [],
    });
  }

  return steps;
}

export function resolveSprintStepKinds(sprint: RoadmapSprintInput): StandardSprintStepKind[] {
  const kinds: StandardSprintStepKind[] = ['implement'];

  if (!sprint.skipLint) {
    kinds.push('lint');
  }

  if (!sprint.skipBuild) {
    kinds.push('build');
  }

  if (sprint.includeValidateStep) {
    kinds.push('validate');
  }

  if (sprint.includeCommitStep ?? true) {
    kinds.push('commit');
  }

  return kinds;
}
