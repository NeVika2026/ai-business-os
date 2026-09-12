import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildHomeDirectorPlan } from '@/utils/home/director-plan';

describe('Home DirectorPlan', () => {
  it('builds a team and execution plan for a concrete business task', () => {
    const result = buildHomeDirectorPlan(
      'Сделай маркетинговую кампанию для страхования ипотечной квартиры для владельцев квартир в VK на месяц',
    );

    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') return;

    assert.equal(result.taskType, 'marketing');
    assert.ok(result.team.length >= 2);
    assert.ok(result.team.some((agent) => /Marketing/i.test(agent.name)));
    assert.ok(result.stages.length >= 3);
    assert.ok(result.estimatedMinutes > 0);
    assert.match(result.estimatedTime, /мин|ч/);
  });

  it('requests clarification before building a plan for an underspecified task', () => {
    const result = buildHomeDirectorPlan('Сделай презентацию');

    assert.equal(result.status, 'clarify');
    if (result.status !== 'clarify') return;

    assert.equal(result.taskType, 'presentation');
    assert.ok(result.questions.length > 0);
  });

  it('accepts clarification answers and then produces the plan', () => {
    const result = buildHomeDirectorPlan('Сделай презентацию', undefined, [
      { question: 'Для кого эта презентация?', answer: 'Для инвестора' },
      { question: 'О чём главный слайд — продукт, идея или результат?', answer: 'Про продукт' },
      { question: 'Какой результат нужен после показа?', answer: 'Получить встречу' },
    ]);

    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') return;

    assert.match(result.resolvedPrompt, /Для инвестора/);
    assert.ok(result.team.length > 0);
  });
});
