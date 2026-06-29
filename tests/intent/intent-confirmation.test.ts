import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyClarificationToPrompt,
  buildIntentConfirmation,
  formatIntentEstimatedTime,
  getIntentClarification,
  shouldAskIntentClarification,
} from '@/utils/intent/intent-confirmation';
import { buildNavigatorRecommendation } from '@/utils/osa/navigator-engine';

describe('intent confirmation', () => {
  it('formats friendly estimated time labels', () => {
    assert.equal(formatIntentEstimatedTime(2), 'About 2 minutes');
    assert.equal(formatIntentEstimatedTime(5), 'About 5 minutes');
    assert.equal(formatIntentEstimatedTime(12), 'About 15 minutes');
  });

  it('builds confirmation content for a known goal', () => {
    const intent = buildIntentConfirmation({
      goalId: 'find_clients',
      starterPrompt: 'I need more clients for my business.',
      recommendation: buildNavigatorRecommendation('I need more clients for my business.'),
    });

    assert.equal(intent.goalTitle, 'Find Clients');
    assert.match(intent.understood, /clients/i);
    assert.ok(intent.willAnalyze.length >= 2);
    assert.ok(intent.willReceive.includes('Action plan'));
    assert.equal(intent.estimatedTime, 'About 2 minutes');
  });

  it('asks one clarification question when confidence is low', () => {
    const recommendation = buildNavigatorRecommendation('help me');
    const intent = buildIntentConfirmation({
      goalId: 'find_clients',
      starterPrompt: 'help me',
      recommendation,
    });

    assert.equal(shouldAskIntentClarification('find_clients', recommendation), true);
    assert.equal(intent.needsClarification, true);
    assert.ok(intent.clarification);
    assert.equal(intent.clarification?.options.length, 2);
  });

  it('skips clarification after the user answers', () => {
    const intent = buildIntentConfirmation({
      goalId: 'find_clients',
      starterPrompt: 'I need more clients.',
      recommendation: buildNavigatorRecommendation('help me'),
      clarificationAnswerId: 'customers',
    });

    assert.equal(intent.needsClarification, false);
    assert.match(intent.understood, /new customers/i);
  });

  it('appends clarification choice to the starter prompt', () => {
    const prompt = applyClarificationToPrompt(
      'find_clients',
      'I need more clients.',
      'partners',
    );

    assert.match(prompt, /business partners/i);
  });

  it('always clarifies for dont_know goals', () => {
    const recommendation = buildNavigatorRecommendation(
      'I need help getting started with my business.',
    );
    const clarification = getIntentClarification('dont_know');

    assert.equal(shouldAskIntentClarification('dont_know', recommendation), true);
    assert.ok(clarification);
    assert.equal(clarification?.options.length, 2);
  });
});
