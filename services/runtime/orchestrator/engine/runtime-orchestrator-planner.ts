import { OrchestratorPlanningError } from '@/services/runtime/orchestrator/engine/runtime-orchestrator-errors';
import type { OrchestratorTask } from '@/services/runtime/orchestrator/engine/runtime-orchestrator-types';

function compareTasks(left: OrchestratorTask, right: OrchestratorTask): number {
  if (right.priority !== left.priority) {
    return right.priority - left.priority;
  }

  return left.id.localeCompare(right.id);
}

export function planExecutionOrder(tasks: OrchestratorTask[]): OrchestratorTask[] {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const task of tasks) {
    indegree.set(task.id, task.dependsOn.length);
    dependents.set(task.id, []);
  }

  for (const task of tasks) {
    for (const dependencyId of task.dependsOn) {
      dependents.get(dependencyId)?.push(task.id);
    }
  }

  const ready: OrchestratorTask[] = tasks
    .filter((task) => (indegree.get(task.id) ?? 0) === 0)
    .sort(compareTasks);

  const ordered: OrchestratorTask[] = [];

  while (ready.length > 0) {
    ready.sort(compareTasks);
    const current = ready.shift();

    if (!current) {
      break;
    }

    ordered.push(current);

    for (const dependentId of dependents.get(current.id) ?? []) {
      const nextDegree = (indegree.get(dependentId) ?? 0) - 1;
      indegree.set(dependentId, nextDegree);

      if (nextDegree === 0) {
        const dependentTask = taskById.get(dependentId);

        if (dependentTask) {
          ready.push(dependentTask);
        }
      }
    }
  }

  if (ordered.length !== tasks.length) {
    throw new OrchestratorPlanningError('task graph contains a cycle or unresolved dependencies');
  }

  return ordered;
}

export function getPlannedOrderIds(tasks: OrchestratorTask[]): string[] {
  return planExecutionOrder(tasks).map((task) => task.id);
}
