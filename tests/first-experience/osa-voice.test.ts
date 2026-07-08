import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildHomeGreeting, OSA_PROCESS_STEPS, OSA_VOICE } from '@/utils/first-experience/osa-voice';

describe('osa voice', () => {
  it('uses warm human copy without corporate terminology', () => {
    assert.match(OSA_VOICE.intro.title, /помочь/i);
    assert.match(OSA_VOICE.home.greetingToday, /сегодня помочь/i);
    assert.doesNotMatch(OSA_VOICE.home.subtitle, /Workspace|Orchestra|Runtime|Executive/i);
    assert.doesNotMatch(OSA_VOICE.result.autoContinueQuestion, /автоматически/i);
  });

  it('defines calm process steps in first person', () => {
    assert.equal(OSA_PROCESS_STEPS.length, 4);
    assert.match(OSA_PROCESS_STEPS[0] ?? '', /Слушаю/);
  });

  it('builds a soft home greeting with optional organization name', () => {
    const greeting = buildHomeGreeting('Acme');

    assert.equal(greeting.presence, OSA_VOICE.home.presence);
    assert.equal(greeting.eyebrow, 'Acme');
  });
});
