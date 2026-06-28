'use client';

import { useState } from 'react';

import { RunTimeline } from '@/components/orchestrator/run-timeline';
import { RunsTable } from '@/components/orchestrator/runs-table';
import { OsaExecutionGraphPanel } from '@/components/osa/osa-execution-graph';
import { OsaExecutionSessionPanel } from '@/components/osa/osa-execution-session';
import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import {
  filterOsaTimelineEvents,
  getOsaExecutionGraph,
  getOsaExecutionSession,
} from '@/utils/osa/osa-runs';

type OsaRunHistoryProps = {
  runs: OrchestratorRun[];
  eventsByRunId: Record<string, OrchestratorEvent[]>;
};

export function OsaRunHistory({ runs, eventsByRunId }: OsaRunHistoryProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const activeRunId =
    selectedRunId && runs.some((run) => run.id === selectedRunId)
      ? selectedRunId
      : (runs[0]?.id ?? null);

  const selectedEvents = activeRunId ? (eventsByRunId[activeRunId] ?? []) : [];
  const selectedRun = runs.find((run) => run.id === activeRunId) ?? null;
  const executionGraph = selectedRun ? getOsaExecutionGraph(selectedRun) : null;
  const executionSession = selectedRun ? getOsaExecutionSession(selectedRun) : null;

  return (
    <div className="space-y-6">
      <RunsTable
        runs={runs}
        variant="osa"
        title="История задач"
        description="Последние 20 OSA-запусков вашей организации"
        selectedRunId={activeRunId}
        onSelectRun={setSelectedRunId}
      />

      {activeRunId ? (
        <>
          <OsaExecutionSessionPanel session={executionSession} />
          <OsaExecutionGraphPanel graph={executionGraph} />
          <RunTimeline
            events={filterOsaTimelineEvents(selectedEvents)}
            title="Timeline запуска"
            description="События OSA для выбранной задачи"
          />
        </>
      ) : null}
    </div>
  );
}
