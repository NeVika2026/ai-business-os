import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { buildExecutiveAttentionItems } from '@/lib/executive/executive-watcher';
import { publishRuntimeEvent, resetRuntimeEventStore } from '@/lib/events/event-runtime';
import { resetExecutiveState } from '@/lib/executive/executive-state';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import type { OrchestratorRun } from '@/types/orchestrator';
import type { CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import { buildConciergeFromSnapshot, createEmptyConcierge } from '@/utils/home/concierge-mappers';

const NOW = new Date('2026-06-28T10:00:00.000Z');
const STALE_AT = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

function createRun(
  overrides: Partial<OrchestratorRun> & Pick<OrchestratorRun, 'id' | 'status'>,
): OrchestratorRun {
  return {
    organization_id: 'org-watch',
    ai_employee_id: 'agent-001',
    input: { action: 'osa_task', source: 'osa_workspace', user_prompt: 'Launch landing' },
    output: null,
    error_message: null,
    tokens_input: 120,
    tokens_output: 80,
    started_at: STALE_AT,
    completed_at: STALE_AT,
    created_at: STALE_AT,
    employee: { id: 'agent-001', name: 'OSA Navigator', role_title: 'Navigator' },
    ...overrides,
  };
}

function createSnapshot(overrides: Partial<CabinetRawSnapshot> = {}): CabinetRawSnapshot {
  return {
    runs: [],
    events: [],
    organization: {
      id: 'org-watch',
      name: 'Acme AI',
      settings: {},
      created_at: STALE_AT,
    },
    projects: [
      {
        id: 'project-landing',
        name: 'Landing Page',
        status: 'active',
        project_type: 'marketing',
        created_at: STALE_AT,
        updated_at: STALE_AT,
      },
    ],
    projectCount: 1,
    workspaceCount: 1,
    agentCount: 1,
    documentCount: 0,
    knowledgeSourceCount: 0,
    crmLeadCount: 0,
    memoryCount: 0,
    health: {
      database: 'healthy',
      gateway: 'healthy',
      runtime: 'healthy',
      memory: 'healthy',
      knowledge: 'healthy',
      automation: 'healthy',
    },
    userEmail: 'alex@example.com',
    ...overrides,
  };
}

const context = {
  email: 'alex@example.com',
  organizationName: 'Acme AI',
  userName: 'Alex Owner',
};

describe('Executive Watcher', () => {
  beforeEach(() => {
    resetProjectRuntimeStore();
    resetExecutiveState();
    resetRuntimeEventStore();
  });

  it('detects stale active projects without progress', () => {
    const snapshot = createSnapshot();
    const concierge = buildConciergeFromSnapshot(snapshot, context);
    const items = buildExecutiveAttentionItems({
      scope: { organizationId: 'org-watch', userId: context.email },
      snapshot,
      concierge,
      workspace: null,
      now: NOW,
    });

    const stale = items.find((item) => item.projectName === 'Landing Page');

    assert.ok(stale);
    assert.match(stale?.cause ?? '', /Нет прогресса/);
    assert.equal(stale?.priority, 'high');
    assert.equal(stale?.actionKind, 'open_workspace');
  });

  it('detects recurring failed runs', () => {
    const snapshot = createSnapshot({
      runs: [
        createRun({ id: 'run-failed-1', status: 'failed' }),
        createRun({ id: 'run-failed-2', status: 'failed' }),
      ],
    });
    const concierge = buildConciergeFromSnapshot(snapshot, context);
    const items = buildExecutiveAttentionItems({
      scope: { organizationId: 'org-watch', userId: context.email },
      snapshot,
      concierge,
      workspace: null,
      now: NOW,
    });

    assert.ok(items.some((item) => item.title.includes('ошибки AI')));
    assert.ok(items.some((item) => item.priority === 'high'));
    assert.equal(items.some((item) => item.actionKind === 'redistribute_team'), true);
  });

  it('detects workspace prompt failures from event runtime', () => {
    publishRuntimeEvent({
      projectId: 'project-landing',
      type: RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_FAILED,
      actor: 'system:test',
      source: 'workspace',
      status: 'failed',
      payload: { reason: 'gateway_error' },
    });
    publishRuntimeEvent({
      projectId: 'project-landing',
      type: RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_FAILED,
      actor: 'system:test',
      source: 'workspace',
      status: 'failed',
      payload: { reason: 'gateway_error' },
    });

    const snapshot = createSnapshot();
    const concierge = createEmptyConcierge(context);
    const items = buildExecutiveAttentionItems({
      scope: { organizationId: 'org-watch', userId: context.email },
      snapshot,
      concierge,
      workspace: null,
      now: NOW,
    });

    assert.ok(items.some((item) => item.cause.includes('Gateway')));
    assert.ok(items.some((item) => item.actionKind === 'reorder_work'));
  });

  it('forms attention items with cause, consequence, recommendation and priority', () => {
    const snapshot = createSnapshot({
      health: {
        database: 'healthy',
        gateway: 'warning',
        runtime: 'healthy',
        memory: 'healthy',
        knowledge: 'healthy',
        automation: 'healthy',
      },
    });
    const concierge = buildConciergeFromSnapshot(snapshot, context);
    const items = buildExecutiveAttentionItems({
      scope: { organizationId: 'org-watch', userId: context.email },
      snapshot,
      concierge,
      workspace: null,
      now: NOW,
    });

    const healthItem = items.find((item) => item.title.includes('gateway'));

    assert.ok(healthItem);
    assert.ok(healthItem?.cause.length > 0);
    assert.ok(healthItem?.consequence.length > 0);
    assert.ok(healthItem?.recommendation.length > 0);
    assert.equal(healthItem?.actionKind, 'request_decision');
  });
});
