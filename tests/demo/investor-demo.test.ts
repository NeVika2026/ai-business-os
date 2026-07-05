import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildDemoProjectDescription,
  DEMO_PROJECT_TEMPLATES,
  isDemoProjectDescription,
  selectDemoProjectTemplate,
} from '@/lib/demo/demo-project-catalog';
import {
  INVESTOR_DEMO_STEP_ORDER,
  investorDemoStepDuration,
  nextInvestorDemoStep,
  totalInvestorDemoDurationMs,
} from '@/utils/demo/demo-orchestrator';

describe('Investor Demo Mode', () => {
  it('selects demo project templates from catalog', () => {
    const template = selectDemoProjectTemplate(0);

    assert.equal(template.name, DEMO_PROJECT_TEMPLATES[0]?.name);
    assert.ok(isDemoProjectDescription(buildDemoProjectDescription(template)));
  });

  it('orders demo steps for the investor journey', () => {
    assert.deepEqual(INVESTOR_DEMO_STEP_ORDER, [
      'first_contact',
      'briefing',
      'workspace',
      'decision',
      'orchestra_continue',
      'memory',
      'replay',
      'complete',
    ]);
    assert.equal(nextInvestorDemoStep('briefing'), 'workspace');
    assert.equal(nextInvestorDemoStep('replay'), 'complete');
  });

  it('targets a ~90 second scripted demo duration', () => {
    const total = totalInvestorDemoDurationMs();

    assert.ok(total >= 50_000);
    assert.ok(total <= 70_000);
    assert.equal(investorDemoStepDuration('briefing'), 8_000);
    assert.equal(investorDemoStepDuration('complete'), null);
  });
});
