import type {
  RoadmapInput,
  RoadmapSprintInput,
} from '@/services/runtime/orchestrator/roadmap/roadmap-types';
import type {
  RoadmapSessionRecord,
  RoadmapSessionReport,
  RoadmapSessionReportSprint,
  RoadmapSessionStatus,
} from '@/services/runtime/orchestrator/session/roadmap-session-types';

function toReportSprint(record: {
  sprintId: string;
  sprintCode: string;
  status: string;
  result: { nextRecommendedAction: string | null } | null;
}): RoadmapSessionReportSprint {
  return {
    sprintId: record.sprintId,
    sprintCode: record.sprintCode,
    status: record.status as RoadmapSessionReportSprint['status'],
    nextRecommendedAction: record.result?.nextRecommendedAction ?? null,
  };
}

function resolveNextRecommendedAction(record: RoadmapSessionRecord, roadmap: RoadmapInput): string {
  if (record.pauseReason) {
    return record.pauseReason;
  }

  if (record.stopReason) {
    return `Session stopped: ${record.stopReason}`;
  }

  if (record.status === 'completed') {
    return 'Roadmap completed. Review sprint reports and approve pending commits.';
  }

  if (record.status === 'failed') {
    const failed = record.sprintRecords.find((sprint) => sprint.status === 'failed');
    if (failed) {
      return `Fix failed sprint ${failed.sprintCode} before continuing`;
    }

    return 'Review failed sprints and restart session';
  }

  const completed = new Set(record.completedSprintIds);
  const next = roadmap.sprints.find((sprint) => {
    if (completed.has(sprint.id) || record.failedSprintIds.includes(sprint.id)) {
      return false;
    }

    return (sprint.dependsOn ?? []).every((depId) => completed.has(depId));
  });

  if (!next) {
    return 'No runnable sprints remain';
  }

  return `Run next sprint: ${next.code} — ${next.title}`;
}

export function buildRoadmapSessionReport(
  record: RoadmapSessionRecord,
  roadmap: RoadmapInput,
): RoadmapSessionReport {
  const completedSprints = record.sprintRecords
    .filter((sprint) => sprint.status === 'completed')
    .map(toReportSprint);

  const failedSprints = record.sprintRecords
    .filter((sprint) => sprint.status === 'failed')
    .map(toReportSprint);

  const completedOrFailed = new Set([...record.completedSprintIds, ...record.failedSprintIds]);

  const pendingSprints: RoadmapSessionReportSprint[] = roadmap.sprints
    .filter((sprint) => !completedOrFailed.has(sprint.id))
    .map((sprint) => ({
      sprintId: sprint.id,
      sprintCode: sprint.code,
      status: 'pending',
      nextRecommendedAction: null,
    }));

  return {
    roadmapId: record.roadmapId,
    roadmapTitle: record.roadmapTitle,
    status: record.status,
    completedSprints,
    failedSprints,
    pendingSprints,
    nextRecommendedAction: resolveNextRecommendedAction(record, roadmap),
    pauseReason: record.pauseReason,
    stopReason: record.stopReason,
  };
}

export function mapHubResultToSprintStatus(result: {
  finished: boolean;
  paused: boolean;
  failed: boolean;
}): 'completed' | 'failed' | 'blocked' {
  if (result.finished) {
    return 'completed';
  }

  if (result.failed) {
    return 'failed';
  }

  return 'blocked';
}

export function mapExecutionToSessionStatus(
  sprintStatuses: Array<'completed' | 'failed' | 'blocked'>,
  paused: boolean,
  stopped: boolean,
): RoadmapSessionStatus {
  if (paused) {
    return 'paused';
  }

  if (stopped) {
    return 'stopped';
  }

  if (sprintStatuses.some((status) => status === 'failed')) {
    return 'failed';
  }

  if (sprintStatuses.length > 0 && sprintStatuses.every((status) => status === 'completed')) {
    return 'completed';
  }

  return 'running';
}

export function findNextRunnableSprint(
  roadmap: RoadmapInput,
  completedSprintIds: string[],
  failedSprintIds: string[],
): RoadmapSprintInput | null {
  const completed = new Set(completedSprintIds);
  const failed = new Set(failedSprintIds);

  for (const sprint of roadmap.sprints) {
    if (completed.has(sprint.id) || failed.has(sprint.id)) {
      continue;
    }

    const depsMet = (sprint.dependsOn ?? []).every((depId) => completed.has(depId));

    if (depsMet) {
      return sprint;
    }
  }

  return null;
}
