import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  LIVE_THINKING_STEPS,
  buildLiveThinkingStatuses,
  canRevealDiscovery,
  isLiveThinkingSequenceComplete,
} from '@/utils/home/live-thinking';

describe('live thinking', () => {
  it('defines a living thought sequence without progress percentages', () => {
    assert.equal(LIVE_THINKING_STEPS.length, 6);
    assert.match(LIVE_THINKING_STEPS[0] ?? '', /Понимаю/);
    assert.match(LIVE_THINKING_STEPS[5] ?? '', /рекомендации/);
  });

  it('builds progressive statuses with a current active thought', () => {
    const mid = buildLiveThinkingStatuses(2, false);

    assert.equal(mid.length, 2);
    assert.equal(mid[0]?.kind, 'step');
    assert.equal(mid[0] && mid[0].kind === 'step' ? mid[0].done : false, true);
    assert.equal(mid[1] && mid[1].kind === 'step' ? mid[1].done : true, false);
  });

  it('adds almost-ready when the sequence finished but gateway is pending', () => {
    const statuses = buildLiveThinkingStatuses(LIVE_THINKING_STEPS.length, false);

    assert.ok(isLiveThinkingSequenceComplete(LIVE_THINKING_STEPS.length));
    assert.equal(statuses.at(-1)?.kind, 'almost');
    assert.equal(canRevealDiscovery(LIVE_THINKING_STEPS.length, false), false);
  });

  it('allows discovery only when sequence and gateway are both done', () => {
    assert.equal(canRevealDiscovery(LIVE_THINKING_STEPS.length, true), true);
    assert.equal(canRevealDiscovery(3, true), false);
  });
});
