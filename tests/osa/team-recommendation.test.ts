import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildNavigatorRecommendation } from '@/utils/osa/navigator-engine';
import { getOsaTeamRecommendation, recommendOsaTeam } from '@/utils/osa/team-recommendation';

describe('OSA team recommendation', () => {
  it('returns navigator-backed team with confidence metadata', () => {
    const result = getOsaTeamRecommendation('Я директор завода и хочу сократить рутину');

    assert.ok(result.team.length >= 4);
    assert.ok(result.recommendation.confidence > 0);
    assert.ok(result.team.some((agent) => agent.name === 'AI Business Manager'));
  });

  it('includes AI Estate for real estate scenarios', () => {
    const team = recommendOsaTeam('Я инвест-брокер и хочу больше клиентов по новостройкам');
    assert.ok(team.some((agent) => agent.name === 'AI Estate'));
  });

  it('includes AI MLM for network marketing scenarios', () => {
    const team = recommendOsaTeam('Я сетевик и хочу автоматизировать рекрутинг');
    assert.ok(team.some((agent) => agent.name === 'AI MLM'));
  });

  it('includes AI Content for content-heavy scenarios', () => {
    const team = recommendOsaTeam('Нужен контент для telegram и reels');
    assert.ok(team.some((agent) => agent.name === 'AI Content'));
  });

  it('maps navigator primary team categories to OSA agents', () => {
    const recommendation = buildNavigatorRecommendation(
      'Собери KPI, метрики и дашборд эффективности маркетинга',
    );
    const team = recommendOsaTeam('Собери KPI, метрики и дашборд эффективности маркетинга');

    assert.ok(recommendation.primaryTeam.includes('Analytics'));
    assert.ok(team.some((agent) => agent.name === 'AI Analyst'));
  });
});
