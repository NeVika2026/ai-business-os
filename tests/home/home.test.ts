import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { OrchestratorRun } from '@/types/orchestrator';
import type { CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import {
  ASK_OSA_PLACEHOLDERS,
  buildHomeFromSnapshot,
  createEmptyHome,
  getHomeGoalById,
  HOME_GOALS,
  isHomeGoalId,
  mapContinueWorking,
  mapDailySummary,
  mapPinnedActions,
  mapSmartSuggestions,
  mapWelcome,
  resolveHomeUserName,
} from '@/utils/home/home-mappers';
import { HOME_GOAL_STORAGE_KEY } from '@/utils/home/home-types';

const now = new Date();
const NOW = now.toISOString();

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
    started_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
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
      createRun({ id: 'run-failed', status: 'failed' }),
    ],
    events: [
      {
        id: 'event-001',
        organization_id: 'org-001',
        type: 'osa_task_submitted',
        source: 'osa',
        actor_type: 'system',
        actor_id: null,
        payload: {},
        correlation_id: 'run-active',
        created_at: NOW,
      },
    ],
    organization: {
      id: 'org-001',
      name: 'Acme AI',
      settings: {},
      created_at: NOW,
    },
    projects: [
      {
        id: 'project-001',
        name: 'Marketing Launch',
        status: 'active',
        project_type: 'marketing',
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    projectCount: 1,
    workspaceCount: 1,
    agentCount: 2,
    documentCount: 3,
    knowledgeSourceCount: 1,
    crmLeadCount: 0,
    memoryCount: 1,
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

describe('home loader and mappers', () => {
  it('exposes goal catalog and storage key', () => {
    assert.equal(HOME_GOALS.length, 8);
    assert.equal(HOME_GOALS[0]?.id, 'increase_revenue');
    assert.equal(HOME_GOAL_STORAGE_KEY, 'ai-business-os-home-goal');
    assert.equal(isHomeGoalId('launch_project'), true);
    assert.equal(isHomeGoalId('invalid'), false);
    assert.equal(getHomeGoalById('dont_know')?.label, "Don't Know Where To Start");
  });

  it('maps welcome and resolves user name', () => {
    const welcome = mapWelcome(context, createSnapshot());

    assert.equal(welcome.userName, 'Alex Owner');
    assert.equal(welcome.organization, 'Acme AI');
    assert.equal(welcome.workspace, 'Acme AI');
    assert.equal(resolveHomeUserName({ ...context, userName: null }), 'alex');
  });

  it('maps continue working with running execution and last project', () => {
    const continueWorking = mapContinueWorking(createSnapshot());

    assert.equal(continueWorking.runningExecution?.status, 'running');
    assert.equal(continueWorking.lastProject?.name, 'Marketing Launch');
    assert.equal(continueWorking.resumeLabel, 'Resume execution');
    assert.match(continueWorking.resumeHref ?? '', /\/orchestrator\/runs\//);
  });

  it('maps suggestions, pinned actions, and daily summary', () => {
    const snapshot = createSnapshot();
    const suggestions = mapSmartSuggestions(snapshot);
    const pinnedActions = mapPinnedActions(snapshot);
    const dailySummary = mapDailySummary(snapshot);

    assert.ok(suggestions.length > 0);
    assert.equal(pinnedActions.length, 4);
    assert.equal(pinnedActions[0]?.label, 'Run OSA');
    assert.equal(dailySummary.todayExecutions >= 1, true);
    assert.equal(dailySummary.completed >= 1, true);
    assert.equal(dailySummary.failed >= 1, true);
    assert.match(dailySummary.aiUsageLabel, /tokens/);
  });

  it('builds full home data from cabinet snapshot', () => {
    const home = buildHomeFromSnapshot(createSnapshot(), context);

    assert.equal(home.welcome.userName, 'Alex Owner');
    assert.equal(home.goals.length, 8);
    assert.equal(home.recentProjects.length, 1);
    assert.equal(home.recentExecutions.length >= 1, true);
    assert.deepEqual(home.askOsaPlaceholders, ASK_OSA_PLACEHOLDERS);
    assert.equal(home.continueWorking.lastProject?.id, 'project-001');
  });

  it('creates empty home fallback', () => {
    const home = createEmptyHome(context);

    assert.equal(home.recentProjects.length, 0);
    assert.equal(home.continueWorking.resumeLabel, 'Start with OSA');
    assert.equal(home.dailySummary.todayExecutions, 0);
  });

  it('suggests first project when none exist', () => {
    const suggestions = mapSmartSuggestions(createSnapshot({ projects: [], projectCount: 0 }));

    assert.ok(suggestions.some((item) => item.id === 'create-first-project'));
  });
});
