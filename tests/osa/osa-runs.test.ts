import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import { RUN_EVENT_LABELS } from '@/types/orchestrator';
import {
  filterOsaTimelineEvents,
  getOsaRunGoal,
  getOsaRuntimeMode,
  getOsaRunTeam,
  groupEventsByRunId,
  isOsaRun,
} from '@/utils/osa/osa-runs';

const BASE_RUN: OrchestratorRun = {
  id: 'run-001',
  organization_id: '11111111-1111-1111-1111-111111111111',
  ai_employee_id: 'osa000001-0000-4000-8000-000000000001',
  status: 'completed',
  input: {
    action: 'osa_task',
    source: 'osa_workspace',
    user_prompt: 'Подготовь план на неделю',
    agent_trace: ['Navigator', 'AI CRM'],
    simulated: true,
    runtime_bridge_enabled: false,
  },
  output: {
    simulated: true,
    runtime_bridge_enabled: false,
    status: 'simulated',
  },
  error_message: null,
  tokens_input: 0,
  tokens_output: 0,
  started_at: '2026-06-27T10:00:00.000Z',
  completed_at: '2026-06-27T10:00:05.000Z',
  created_at: '2026-06-27T10:00:00.000Z',
  employee: {
    id: 'osa000001-0000-4000-8000-000000000001',
    name: 'OSA Navigator',
    role_title: 'OSA Navigator',
  },
};

describe('OSA run history helpers', () => {
  it('detects OSA runs by action or source', () => {
    assert.equal(isOsaRun(BASE_RUN), true);
    assert.equal(isOsaRun({ ...BASE_RUN, input: { action: 'execute' } }), false);
  });

  it('extracts goal, team, and runtime mode', () => {
    assert.equal(getOsaRunGoal(BASE_RUN), 'Подготовь план на неделю');
    assert.equal(getOsaRunTeam(BASE_RUN), 'Navigator → AI CRM');
    assert.equal(getOsaRuntimeMode(BASE_RUN), 'Demo');
    assert.equal(
      getOsaRuntimeMode({
        ...BASE_RUN,
        input: { ...BASE_RUN.input, simulated: false, runtime_bridge_enabled: true },
        output: { simulated: false, runtime_bridge_enabled: true },
      }),
      'Runtime',
    );
  });

  it('groups events by run id and filters OSA timeline events', () => {
    const events: OrchestratorEvent[] = [
      {
        id: 'event-1',
        organization_id: BASE_RUN.organization_id,
        type: 'osa_task_submitted',
        source: 'osa',
        actor_type: 'user',
        actor_id: 'user-1',
        payload: {},
        correlation_id: 'run-001',
        created_at: '2026-06-27T10:00:00.000Z',
      },
      {
        id: 'event-2',
        organization_id: BASE_RUN.organization_id,
        type: 'run_started',
        source: 'orchestrator',
        actor_type: 'user',
        actor_id: 'user-1',
        payload: {},
        correlation_id: 'run-001',
        created_at: '2026-06-27T10:00:01.000Z',
      },
    ];

    const grouped = groupEventsByRunId(events);
    assert.equal(grouped['run-001']?.length, 2);
    assert.equal(filterOsaTimelineEvents(events).length, 1);
    assert.equal(filterOsaTimelineEvents(events)[0]?.type, 'osa_task_submitted');
  });

  it('exposes timeline label for osa_execution_plan_created', () => {
    assert.equal(RUN_EVENT_LABELS.osa_execution_plan_created, 'Execution Plan создан');
  });
});
