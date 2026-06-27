import type { AutomationPlanInput } from '@/services/runtime/orchestrator/automation/automation-types';
import { RoadmapSprintNotFoundError } from '@/services/runtime/orchestrator/roadmap/roadmap-errors';
import { buildStandardSprintSteps } from '@/services/runtime/orchestrator/roadmap/roadmap-templates';
import type {
  RoadmapInput,
  RoadmapSprintInput,
  RoadmapSprintPlan,
  SprintCompileOptions,
} from '@/services/runtime/orchestrator/roadmap/roadmap-types';
import {
  validateRoadmapInput,
  validateSprintInput,
} from '@/services/runtime/orchestrator/roadmap/roadmap-validator';

function buildPlanId(sprint: RoadmapSprintInput): string {
  return `plan-${sprint.id}`;
}

export function compileSprintPlan(
  sprint: RoadmapSprintInput,
  options?: SprintCompileOptions,
): AutomationPlanInput {
  validateSprintInput(sprint);

  const steps = buildStandardSprintSteps(sprint, options);

  return {
    id: buildPlanId(sprint),
    title: `${sprint.code}: ${sprint.title}`,
    steps,
  };
}

export function compileSprintPlanMeta(
  sprint: RoadmapSprintInput,
  options?: SprintCompileOptions,
): RoadmapSprintPlan {
  const plan = compileSprintPlan(sprint, options);

  return {
    sprintId: sprint.id,
    sprintCode: sprint.code,
    sprintTitle: sprint.title,
    planId: plan.id,
    planTitle: plan.title,
    stepIds: plan.steps.map((step) => step.id),
  };
}

export function compileRoadmapPlans(
  roadmap: RoadmapInput,
  options?: SprintCompileOptions,
): AutomationPlanInput[] {
  validateRoadmapInput(roadmap);

  return roadmap.sprints.map((sprint) => compileSprintPlan(sprint, options));
}

export function findRoadmapSprint(roadmap: RoadmapInput, sprintId: string): RoadmapSprintInput {
  validateRoadmapInput(roadmap);

  const sprint = roadmap.sprints.find((candidate) => candidate.id === sprintId);

  if (!sprint) {
    throw new RoadmapSprintNotFoundError(sprintId);
  }

  return sprint;
}

export function listRunnableSprints(
  roadmap: RoadmapInput,
  completedSprintIds: string[],
): RoadmapSprintInput[] {
  validateRoadmapInput(roadmap);

  const completed = new Set(completedSprintIds);

  return roadmap.sprints.filter((sprint) => {
    if (completed.has(sprint.id)) {
      return false;
    }

    return (sprint.dependsOn ?? []).every((depId) => completed.has(depId));
  });
}

export function createRoadmapPlanner() {
  return {
    compileSprintPlan,
    compileSprintPlanMeta,
    compileRoadmapPlans,
    findRoadmapSprint,
    listRunnableSprints,
    validateRoadmap: validateRoadmapInput,
  };
}

export type RoadmapPlanner = ReturnType<typeof createRoadmapPlanner>;

export const roadmapPlanner = createRoadmapPlanner();
