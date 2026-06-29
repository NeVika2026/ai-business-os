import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { OrchestratorRun } from '@/types/orchestrator';
import type { CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import {
  buildConciergeFromSnapshot,
  CONVERSATION_CHIPS,
  createEmptyConcierge,
  getConversationChipGoalId,
  getJourneyGoalId,
  mapConciergeGreeting,
  mapContinueJourney,
  mapDailyMission,
  mapPersonalInsights,
  mapSuggestedJourneys,
  resolveConciergeSalutation,
} from '@/utils/home/concierge-mappers';
import { buildHomeFromSnapshot } from '@/utils/home/home-mappers';

const now = new Date('2026-06-28T10:00:00.000Z');
const NOW = now.toISOString();

function createRun(
  overrides: Partial<OrchestratorRun> & Pick<OrchestratorRun, 'id' | 'status'>,
): OrchestratorRun {
  return {
    organization_id: 'org-001',
    ai_employee_id: 'agent-001',
    input: {
      action: 'osa_task',
      source: 'osa_workspace',
      user_prompt: 'Build marketing campaign',
    },
    output: null,
    error_message: null,
    tokens_input: 120,
    tokens_output: 80,
    started_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
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
      createRun({ id: 'run-marketing', status: 'completed' }),
      createRun({
        id: 'run-auto',
        status: 'completed',
        input: {
          action: 'automation_workflow',
          source: 'osa_workspace',
          user_prompt: 'Automate routine reporting',
        },
      }),
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
    documentCount: 2,
    knowledgeSourceCount: 3,
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

describe('concierge loader and mappers', () => {
  it('maps conversation chips to goal ids', () => {
    assert.equal(CONVERSATION_CHIPS.length, 6);
    assert.equal(getConversationChipGoalId('revenue'), 'increase_revenue');
    assert.equal(getConversationChipGoalId('not_sure'), 'dont_know');
    assert.equal(getConversationChipGoalId('missing'), null);
  });

  it('greets user with time-based salutation and current context', () => {
    const home = buildHomeFromSnapshot(createSnapshot(), context);
    const greeting = mapConciergeGreeting(home, now);

    assert.equal(greeting.salutation, resolveConciergeSalutation(now));
    assert.equal(greeting.userName, 'Alex Owner');
    assert.match(greeting.currentFocus, /Resume/);
    assert.equal(greeting.currentProject, 'Marketing Launch');
  });

  it('maps suggested journeys and resolves journey goal selection', () => {
    const home = buildHomeFromSnapshot(createSnapshot(), context);
    const journeys = mapSuggestedJourneys(home);

    assert.ok(journeys.some((journey) => journey.id === 'continue-project'));
    assert.ok(journeys.some((journey) => journey.id === 'resume-execution'));
    assert.equal(getJourneyGoalId('marketing-plan', journeys), 'create_content');
    assert.equal(getJourneyGoalId('review-yesterday', journeys), null);
  });

  it('maps personal insights from history', () => {
    const insights = mapPersonalInsights(createSnapshot());

    assert.ok(insights.some((insight) => insight.message.includes('AI run')));
    assert.ok(insights.some((insight) => insight.message.includes('Marketing tasks succeed')));
    assert.ok(insights.some((insight) => insight.message.includes('Knowledge base not used')));
  });

  it('maps daily mission and continue journey', () => {
    const home = buildHomeFromSnapshot(createSnapshot(), context);
    const mission = mapDailyMission(home, createSnapshot());
    const journey = mapContinueJourney(home);

    assert.match(mission.title, /workflow/i);
    assert.equal(journey.runningExecutionLabel, 'Build marketing campaign');
    assert.match(journey.resumeHref, /\/results\//);
  });

  it('builds full concierge data from snapshot', () => {
    const concierge = buildConciergeFromSnapshot(createSnapshot(), context, now);

    assert.equal(concierge.conversationChips.length, 6);
    assert.equal(concierge.suggestedJourneys.length >= 4, true);
    assert.equal(concierge.insights.length >= 1, true);
    assert.ok(concierge.dailyMission.title.length > 0);
    assert.ok(concierge.continueJourney.resumeHref);
  });

  it('creates empty concierge fallback', () => {
    const concierge = createEmptyConcierge(context);

    assert.equal(concierge.greeting.currentProject, null);
    assert.equal(concierge.continueJourney.projectName, null);
    assert.ok(concierge.insights[0]?.message.includes('Choose a goal'));
  });
});
