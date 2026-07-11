import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  HERO_GREETINGS,
  HERO_HOME_GREETING,
  HERO_HOME_PLACEHOLDER,
  HERO_PHASE_MS,
  heroLightIntensity,
  heroLightWarmth,
  heroPhaseDelay,
  nextHeroPhase,
  pickHeroGreeting,
} from '@/utils/home/hero-experience';

describe('hero experience', () => {
  it('picks a short greeting', () => {
    assert.ok(HERO_GREETINGS.includes(pickHeroGreeting(new Date('2026-07-08'))));
    assert.ok(HERO_GREETINGS.includes(pickHeroGreeting(new Date('2026-07-09'))));
  });

  it('advances hero phases on schedule', () => {
    assert.equal(nextHeroPhase('orbit-free'), 'orbit-gather');
    assert.equal(nextHeroPhase('orbit-gather'), 'eyes-form');
    assert.equal(nextHeroPhase('eyes-form'), 'eyes-alive');
    assert.equal(nextHeroPhase('eyes-alive'), 'ready');
    assert.equal(heroPhaseDelay('orbit-free'), 1_000);
    assert.equal(heroPhaseDelay('orbit-gather'), 1_000);
    assert.equal(heroPhaseDelay('eyes-form'), 500);
    assert.equal(heroPhaseDelay('eyes-alive'), 1_000);
  });

  it('exposes home copy constants', () => {
    assert.equal(HERO_HOME_GREETING, 'Чем сегодня помочь?');
    assert.match(HERO_HOME_PLACEHOLDER, /создать/);
  });

  it('warms light while typing', () => {
    assert.ok(heroLightWarmth('ready', true) > heroLightWarmth('orbit-free', false));
    assert.ok(heroLightIntensity('eyes-form', true) >= heroLightIntensity('eyes-form', false));
  });
});
