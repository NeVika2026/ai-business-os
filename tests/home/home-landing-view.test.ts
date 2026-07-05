import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { OrchestratorRun } from '@/types/orchestrator';
import type { CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import { buildConciergeFromSnapshot } from '@/utils/home/concierge-mappers';
import { buildHomeFromSnapshot } from '@/utils/home/home-mappers';
import { formatLandingStatLines, mapHomeLandingView } from '@/utils/home/home-landing-view';

const NOW = '2026-06-28T10:00:00.000Z';

function createRun(
  overrides: Partial<OrchestratorRun> & Pick<OrchestratorRun, 'id' | 'status'>,
): OrchestratorRun {
  return {
    organization_id: 'org-001',
    ai_employee_id: 'agent-001',
    input: { action: 'osa_task', source: 'osa_workspace', user_prompt: 'Grow revenue' },
    output: null,
    error_message: null,
    tokens_input: 120,
    tokens_output: 80,
    started_at: NOW,
    completed_at: NOW,
    created_at: NOW,
    employee: { id: 'agent-001', name: 'OSA Navigator', role_title: 'Navigator' },
    ...overrides,
  };
}

function createSnapshot(overrides: Partial<CabinetRawSnapshot> = {}): CabinetRawSnapshot {
  return {
    runs: [
      createRun({ id: 'run-active', status: 'running', completed_at: null }),
      createRun({ id: 'run-done', status: 'completed' }),
    ],
    events: [],
    organization: {
      id: 'org-001',
      name: 'Acme AI',
      settings: {},
      created_at: NOW,
    },
    projects: [
      {
        id: 'project-001',
        name: 'OSA Product',
        status: 'active',
        project_type: 'marketing',
        created_at: NOW,
        updated_at: NOW,
      },
      {
        id: 'project-002',
        name: 'Landing Page',
        status: 'active',
        project_type: 'marketing',
        created_at: NOW,
        updated_at: NOW,
      },
      {
        id: 'project-003',
        name: 'Archive',
        status: 'completed',
        project_type: 'marketing',
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    projectCount: 3,
    workspaceCount: 1,
    agentCount: 2,
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

describe('Home landing view', () => {
  it('maps today stats from existing snapshot data', () => {
    const snapshot = createSnapshot();
    const home = buildHomeFromSnapshot(snapshot, context);
    const concierge = buildConciergeFromSnapshot(snapshot, context);
    const landing = mapHomeLandingView(home, snapshot, concierge);
    const stats = formatLandingStatLines(landing);

    assert.equal(landing.activeProjectCount, 2);
    assert.equal(landing.aiTaskCount, 2);
    assert.equal(landing.pendingDecisionCount, 1);
    assert.match(stats.projects, /активных проекта/);
    assert.match(stats.tasks, /AI-задач/);
    assert.match(stats.decisions ?? '', /решение ожидает/);
  });

  it('includes landing data in concierge payload', () => {
    const concierge = buildConciergeFromSnapshot(createSnapshot(), context);

    assert.ok(concierge.landing.nextStepLabel.length > 0);
    assert.ok(concierge.landing.recentActivity.length > 0);
    assert.equal(concierge.landing.continueLabel, 'Continue previous work');
  });

  it('prefers workspace href for continue when resume is home', () => {
    const snapshot = createSnapshot({
      runs: [createRun({ id: 'run-done', status: 'completed' })],
    });
    const home = buildHomeFromSnapshot(snapshot, context);
    const concierge = buildConciergeFromSnapshot(snapshot, context);
    const landing = mapHomeLandingView(home, snapshot, concierge);

    assert.equal(landing.continueHref, '/workspace/project-001');
  });
});
