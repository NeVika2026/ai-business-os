import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetExecutiveState } from '@/lib/executive/executive-state';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { runProjectLifecycle } from '@/lib/project-lifecycle/run-project-lifecycle';
import type { OrchestratorRun } from '@/types/orchestrator';
import type { CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import { buildConciergeFromSnapshot } from '@/utils/home/concierge-mappers';
import { buildMissionControlData, resolveMissionControlProjectId } from '@/utils/mission-control/mission-control-mappers';

const NOW = '2026-06-28T10:00:00.000Z';

function createRun(
  overrides: Partial<OrchestratorRun> & Pick<OrchestratorRun, 'id' | 'status'>,
): OrchestratorRun {
  return {
    organization_id: 'org-mc',
    ai_employee_id: 'agent-001',
    input: { action: 'osa_task', source: 'osa_workspace', user_prompt: 'Launch product' },
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
    runs: [createRun({ id: 'run-active', status: 'running', completed_at: null })],
    events: [],
    organization: {
      id: 'org-mc',
      name: 'Acme AI',
      settings: {},
      created_at: NOW,
    },
    projects: [
      {
        id: 'project-mc-1',
        name: 'OSA Product',
        status: 'active',
        project_type: 'marketing',
        created_at: NOW,
        updated_at: NOW,
      },
      {
        id: 'project-mc-2',
        name: 'Landing Page',
        status: 'active',
        project_type: 'marketing',
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    projectCount: 2,
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
      knowledge: 'warning',
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

describe('Mission Control', () => {
  beforeEach(() => {
    resetProjectRuntimeStore();
    resetExecutiveState();
  });

  it('maps active projects and today focus from existing aggregates', () => {
    const snapshot = createSnapshot();
    const concierge = buildConciergeFromSnapshot(snapshot, context);
    const data = buildMissionControlData({
      concierge,
      snapshot,
      workspace: null,
      context,
    });

    assert.equal(data.activeProjects.length, 2);
    assert.equal(data.activeProjects[0]?.href, '/workspace/project-mc-1');
    assert.ok(data.todayFocus.headline.length > 0);
    assert.ok(data.nextBestAction.label.length > 0);
    assert.equal(data.organizationName, 'Acme AI');
  });

  it('includes subsystem and insight risks without new runtime data', () => {
    const snapshot = createSnapshot({
      runs: [
        createRun({ id: 'run-failed', status: 'failed' }),
        createRun({ id: 'run-active', status: 'running', completed_at: null }),
      ],
    });
    const concierge = buildConciergeFromSnapshot(snapshot, context);
    const data = buildMissionControlData({
      concierge,
      snapshot,
      workspace: null,
      context,
    });

    assert.ok(data.risks.some((risk) => risk.includes('failed')));
    assert.ok(data.risks.some((risk) => risk.includes('knowledge')));
  });

  it('resolves workspace project id from synced runtime', () => {
    const snapshot = createSnapshot();

    runProjectLifecycle({
      projectId: 'project-mc-1',
      name: 'OSA Product',
      description: 'Launch',
      declaredType: 'marketing',
      organizationId: 'org-mc',
      userId: context.email,
    });

    const concierge = buildConciergeFromSnapshot(snapshot, context);
    const activeRuntime = concierge.projectBriefing;

    assert.equal(resolveMissionControlProjectId(
      {
        id: activeRuntime.projectRuntimeId,
        title: activeRuntime.activeProjectTitle,
        description: '',
        status: 'active',
        createdAt: NOW,
        updatedAt: NOW,
        active: true,
        summary: '',
        mission: '',
        lastActivity: null,
        nextStep: activeRuntime.nextStep,
        memorySummary: '',
        navigatorState: {
          selectedStepId: null,
          lastSuggestedStepId: null,
          updatedAt: NOW,
        },
        organizationId: 'org-mc',
        userId: context.email,
        sourceProjectId: 'project-mc-1',
      },
      snapshot,
    ), 'project-mc-1');
  });
});
