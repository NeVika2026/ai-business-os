import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { OrchestratorRun } from '@/types/orchestrator';
import {
  buildMeaningfulLoading,
  buildPersonalWelcome,
  buildResultCelebration,
  buildResultPresentationHeadline,
  buildSmartGreeting,
  buildWhatsNextRecommendation,
  buildWowMoment,
  findLastCompletedWork,
  formatDisplayName,
  resolveRecommendedContinuation,
  resolveSalutation,
} from '@/utils/home/wow-engine';

const NOW = new Date('2026-06-28T10:00:00.000Z');

function createRun(
  overrides: Partial<OrchestratorRun> & Pick<OrchestratorRun, 'id' | 'status'>,
): OrchestratorRun {
  return {
    organization_id: 'org-001',
    ai_employee_id: 'employee-001',
    input: {
      action: 'osa_task',
      source: 'osa_workspace',
      user_prompt: 'Build marketing campaign',
      goal_id: 'create_content',
    },
    output: { resultText: 'Campaign plan ready.' },
    error_message: null,
    tokens_input: 100,
    tokens_output: 200,
    started_at: '2026-06-28T09:00:00.000Z',
    completed_at: '2026-06-28T09:05:00.000Z',
    created_at: '2026-06-28T09:00:00.000Z',
    employee: { id: 'employee-001', name: 'Internal', role_title: 'Internal' },
    ...overrides,
  };
}

describe('wow engine', () => {
  it('formats smart greeting with salutation and productivity headline', () => {
    const greeting = buildSmartGreeting('viktoria', NOW);

    assert.equal(greeting.salutation, resolveSalutation(NOW));
    assert.equal(formatDisplayName('viktoria'), 'Viktoria');
    assert.equal(greeting.userName, 'Viktoria');
    assert.match(greeting.headline, /productive/i);
  });

  it('welcomes returning users with yesterday work and recommendation', () => {
    const lastWork = findLastCompletedWork(
      [
        createRun({
          id: 'run-2',
          status: 'completed',
          created_at: '2026-06-27T12:00:00.000Z',
          completed_at: '2026-06-27T12:05:00.000Z',
          started_at: '2026-06-27T12:00:00.000Z',
          input: {
            action: 'osa_task',
            source: 'osa_workspace',
            user_prompt: 'Market strategy for Q3',
            goal_id: 'create_content',
          },
        }),
      ],
      NOW,
    );

    const welcome = buildPersonalWelcome({
      lastCompletedResultLabel: lastWork?.label ?? null,
      lastCompletedTiming: lastWork?.timing ?? null,
      recommendedContinuationLabel: resolveRecommendedContinuation(lastWork),
    });

    assert.equal(welcome.show, true);
    assert.match(welcome.previousWorkLeadIn ?? '', /Yesterday we finished/i);
    assert.equal(welcome.recommendationLabel, 'Client Acquisition');
  });

  it('builds meaningful loading steps from project and history context', () => {
    const loading = buildMeaningfulLoading({
      projectCount: 2,
      hasPreviousWork: true,
      goalTitle: 'Find Clients',
    });

    assert.equal(loading.steps.length, 3);
    assert.match(loading.steps[0]?.label ?? '', /remembered your projects/i);
    assert.match(loading.finale, /preparing recommendations/i);
  });

  it('builds a personalized wow moment', () => {
    const moment = buildWowMoment({
      userName: 'Victoria',
      goalTitle: 'Find Clients',
      projectCount: 1,
      activeProjectName: 'Marketing Launch',
    });

    assert.match(moment.headline, /Victoria/i);
    assert.match(moment.subline, /Marketing Launch/i);
    assert.match(moment.highlight, /tailored/i);
  });

  it('uses human result presentation and first-result celebration', () => {
    assert.equal(buildResultPresentationHeadline('Completed'), "Here's what I prepared for you.");

    const celebration = buildResultCelebration(1, 'Completed');

    assert.equal(celebration.show, true);
    assert.equal(celebration.headline, 'Great start.');
    assert.match(celebration.message, /first business result/i);
  });

  it('recommends one clear next step', () => {
    const next = buildWhatsNextRecommendation({
      goalTitle: 'Find Clients',
      projectHref: '/projects/project-001',
      status: 'Completed',
    });

    assert.equal(next.title, "What's next?");
    assert.match(next.label, /project/i);
    assert.equal(next.href, '/projects/project-001');
  });
});
