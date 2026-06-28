import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { recommendOsaTeam } from '@/utils/osa/team-recommendation';

describe('OSA team recommendation', () => {
  it('returns base agents for generic input', () => {
    const team = recommendOsaTeam('Я директор завода и хочу сократить рутину');
    assert.equal(team.length, 4);
    assert.ok(team.some((agent) => agent.name === 'AI Business Manager'));
  });

  it('includes AI Estate for real estate keywords', () => {
    const team = recommendOsaTeam('Я инвест-брокер и хочу больше клиентов по новостройкам');
    assert.ok(team.some((agent) => agent.name === 'AI Estate'));
  });

  it('includes AI MLM for network marketing keywords', () => {
    const team = recommendOsaTeam('Я сетевик и хочу автоматизировать рекрутинг');
    assert.ok(team.some((agent) => agent.name === 'AI MLM'));
  });

  it('includes AI Content for content keywords', () => {
    const team = recommendOsaTeam('Нужен контент для telegram и reels');
    assert.ok(team.some((agent) => agent.name === 'AI Content'));
  });
});
