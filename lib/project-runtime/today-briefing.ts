import type { OrchestratorRun } from '@/types/orchestrator';
import type { ProjectRuntime, ProjectTodayBriefing, ProjectRuntimeScope } from '@/types/project-runtime';
import type { CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import { resolveHistoryResultLabel } from '@/utils/results/result-mappers';

import { isDefaultWorkspace } from './active-project';
import { computeProjectProgress } from './project-runtime-engine';
import { getRecentDecisions, syncProjectMemoryState } from './project-runtime-memory';

function resolveLastResult(runtime: ProjectRuntime, runs: OrchestratorRun[]): string | null {
  const { entries } = syncProjectMemoryState(runtime);

  if (entries[0]?.result.trim()) {
    return entries[0].result.trim();
  }

  const latestCompleted = runs.find((run) => run.status === 'completed');

  if (!latestCompleted) {
    return null;
  }

  return resolveHistoryResultLabel(latestCompleted);
}

export function buildProjectTodayBriefing(
  runtime: ProjectRuntime,
  snapshot: CabinetRawSnapshot,
): ProjectTodayBriefing {
  const { entryCount, entries } = syncProjectMemoryState(runtime);
  const lastResult = resolveLastResult(runtime, snapshot.runs);
  const progressPercent = computeProjectProgress(runtime, entryCount);
  const recentDecisions = getRecentDecisions(runtime, 1);
  const nextStep = runtime.nextStep || recentDecisions[0] || entries[0]?.task || 'Определить следующий шаг.';

  const headline = isDefaultWorkspace(runtime)
    ? 'Сегодня вы в Default Workspace'
    : `Сегодня вы работаете над: ${runtime.title}`;

  return {
    activeProjectTitle: runtime.title,
    headline,
    lastResult,
    nextStep,
    progressPercent,
    isDefaultWorkspace: isDefaultWorkspace(runtime),
    projectRuntimeId: runtime.id,
  };
}

export function buildProjectTodayBriefingForScope(
  scope: ProjectRuntimeScope,
  snapshot: CabinetRawSnapshot,
  runtime: ProjectRuntime,
): ProjectTodayBriefing {
  return buildProjectTodayBriefing(runtime, snapshot);
}
