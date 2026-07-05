import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import { advanceAiOrchestraForProject } from '@/lib/project-lifecycle/ai-orchestra-engine';
import { runProjectLifecycle } from '@/lib/project-lifecycle/run-project-lifecycle';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import type { ExecutiveGoal } from '@/types/executive';
import type { ProjectType } from '@/utils/projects/project-types';

export type SeedDemoRuntimeInput = {
  projectId: string;
  projectName: string;
  description: string;
  declaredType: ProjectType;
  organizationId: string;
  userId: string;
  goal: ExecutiveGoal;
};

export function refreshDemoProjectRuntime(input: SeedDemoRuntimeInput): void {
  runProjectLifecycle({
    projectId: input.projectId,
    name: input.projectName,
    description: input.description,
    declaredType: input.declaredType,
    organizationId: input.organizationId,
    userId: input.userId,
  });

  publishRuntimeEvent({
    projectId: input.projectId,
    type: RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_COMPLETED,
    actor: `user:${input.userId}`,
    source: 'workspace',
    payload: {
      demoSeed: true,
      projectName: input.projectName,
    },
  });
}

export function advanceDemoOrchestraAfterDecision(input: {
  projectId: string;
  organizationId: string;
  userId: string;
  projectName: string;
  goal: ExecutiveGoal;
}): void {
  advanceAiOrchestraForProject(
    input.projectId,
    {
      organizationId: input.organizationId,
      userId: input.userId,
    },
    {
      organizationId: input.organizationId,
      userId: input.userId,
      projectName: input.projectName,
      goal: input.goal,
    },
  );
}
