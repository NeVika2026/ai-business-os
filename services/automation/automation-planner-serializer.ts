import type {
  AutomationPlannerPlanResult,
  AutomationPlannerReport,
  AutomationPlannerSnapshot,
  AutomationPlannerStatistics,
  AutomationPlannerTask,
  SerializedAutomationPlannerPlanResult,
  SerializedAutomationPlannerReport,
  SerializedAutomationPlannerSnapshot,
  SerializedAutomationPlannerStatistics,
  SerializedAutomationPlannerTask,
} from '@/services/automation/automation-planner-types';

function serializeTask(task: AutomationPlannerTask): SerializedAutomationPlannerTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    dependencies: [...task.dependencies],
    status: task.status,
    priority: task.priority,
    order: task.order,
    metadata: { ...task.metadata },
  };
}

export function serializeAutomationPlannerStatistics(
  statistics: AutomationPlannerStatistics,
): SerializedAutomationPlannerStatistics {
  return {
    totalTasks: statistics.totalTasks,
    completed: statistics.completed,
    failed: statistics.failed,
    blocked: statistics.blocked,
    ready: statistics.ready,
    pending: statistics.pending,
    remaining: statistics.remaining,
  };
}

export function serializeAutomationPlannerPlanResult(
  plan: AutomationPlannerPlanResult,
): SerializedAutomationPlannerPlanResult {
  return {
    nextTask: plan.nextTask ? serializeTask(plan.nextTask) : null,
    blockedTasks: plan.blockedTasks.map(serializeTask),
    readyTasks: plan.readyTasks.map(serializeTask),
    completedTasks: plan.completedTasks.map(serializeTask),
    remainingTasks: plan.remainingTasks.map(serializeTask),
    executionOrder: [...plan.executionOrder],
  };
}

export function serializeAutomationPlannerReport(
  report: AutomationPlannerReport,
): SerializedAutomationPlannerReport {
  return {
    instanceId: report.instanceId,
    roadmapId: report.roadmapId ?? null,
    roadmapTitle: report.roadmapTitle ?? null,
    statistics: serializeAutomationPlannerStatistics(report.statistics),
    nextTaskId: report.nextTaskId ?? null,
    blockedTaskIds: [...report.blockedTaskIds],
    readyTaskIds: [...report.readyTaskIds],
    completedTaskIds: [...report.completedTaskIds],
    remainingTaskIds: [...report.remainingTaskIds],
    executionOrder: [...report.executionOrder],
    updatedAt: report.updatedAt,
  };
}

export function serializeAutomationPlannerSnapshot(input: {
  snapshot: AutomationPlannerSnapshot;
  plan: AutomationPlannerPlanResult | null;
  report: AutomationPlannerReport;
}): SerializedAutomationPlannerSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    roadmapId: input.snapshot.roadmapId ?? null,
    roadmapTitle: input.snapshot.roadmapTitle ?? null,
    planned: input.snapshot.planned,
    statistics: serializeAutomationPlannerStatistics(input.snapshot.statistics),
    nextTaskId: input.snapshot.nextTaskId ?? null,
    updatedAt: input.snapshot.updatedAt,
    plan: input.plan ? serializeAutomationPlannerPlanResult(input.plan) : null,
    report: serializeAutomationPlannerReport(input.report),
  };
}
