import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildFindClientsFallbackDeliverable,
  parseFindClientsDeliverable,
} from '@/utils/results/find-clients-deliverable';

describe('find-clients deliverable', () => {
  it('parses structured markdown sections', () => {
    const text = `## KEY OUTCOME
Reach marketing directors on LinkedIn this week.

## IDEAL CUSTOMER
- Runs growth at a B2B SaaS company
- Needs more qualified demos

## WHERE TO REACH THEM
- LinkedIn
- Partner introductions

## THIS WEEK
- Monday: Build prospect list

## OUTREACH DRAFT
Hi Alex, quick question about your pipeline.`;

    const deliverable = parseFindClientsDeliverable(text);

    assert.equal(deliverable.keyOutcome, 'Reach marketing directors on LinkedIn this week.');
    assert.equal(deliverable.sections.length, 4);
    assert.equal(deliverable.sections[0]?.id, 'ideal-customer');
    assert.equal(deliverable.outreachDraft, 'Hi Alex, quick question about your pipeline.');
  });

  it('builds a structured fallback without demo jargon', () => {
    const text = buildFindClientsFallbackDeliverable(
      'Find clients for my consulting business',
      'I help SaaS founders improve onboarding',
    );
    const deliverable = parseFindClientsDeliverable(text);

    assert.match(deliverable.keyOutcome, /reach/i);
    assert.ok(deliverable.sections.length >= 3);
    assert.match(text, /OUTREACH DRAFT/);
    assert.doesNotMatch(text, /demo|simulated|agent/i);
  });
});
