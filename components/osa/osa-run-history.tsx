'use client';

import { useState } from 'react';

import { RunTimeline } from '@/components/orchestrator/run-timeline';
import { RunsTable } from '@/components/orchestrator/runs-table';
import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import { filterOsaTimelineEvents } from '@/utils/osa/osa-runs';

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
        <RunTimeline
          events={filterOsaTimelineEvents(selectedEvents)}
          title="Timeline запуска"
          description="События OSA для выбранной задачи"
        />
      ) : null}
    </div>
  );
}
