import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildDevSourceLabel,
  buildFirstResultDevNotice,
  buildLoginFirstResultView,
  isKnownFallbackContent,
  resolveFirstResultSource,
} from '@/lib/login/first-result-view';
import { buildFirstResultFallbackPlan } from '@/lib/login/first-result-plan';

describe('login first result view', () => {
  it('detects known fallback content', () => {
    const fallback = buildFirstResultFallbackPlan('Продажи новостроек');

    assert.equal(isKnownFallbackContent(fallback), true);
    assert.equal(isKnownFallbackContent('1. Сделать лендинг\n2. Запустить рекламу'), false);
  });

  it('resolves source from stored metadata first', () => {
    assert.equal(
      resolveFirstResultSource({
        task: 'Launch',
        content: buildFirstResultFallbackPlan('Launch'),
        usedFallback: false,
      }),
      'ai',
    );

    assert.equal(
      resolveFirstResultSource({
        task: 'Launch',
        content: '1. Сделать лендинг',
        usedFallback: true,
      }),
      'fallback',
    );
  });

  it('builds fallback view from task instead of template opener', () => {
    const view = buildLoginFirstResultView({
      task: 'Хочу увеличить продажи новостроек',
      content: buildFirstResultFallbackPlan('Хочу увеличить продажи новостроек'),
      usedFallback: true,
    });

    assert.equal(view.source, 'fallback');
    assert.equal(view.headline, 'Хочу увеличить продажи новостроек');
    assert.doesNotMatch(view.headline, /Начнём с простого/);
    assert.equal(view.devNotice, 'AI provider is not configured. Fallback result shown.');
    assert.match(view.blocker ?? '', /понятном шаге/);
    assert.ok(view.firstAction);
    assert.ok(view.plan.length > 0);
    assert.ok(view.nextStep);
  });

  it('builds ai view from gateway content', () => {
    const view = buildLoginFirstResultView({
      task: 'Запустить лендинг',
      content: [
        'Сначала нужен один чёткий оффер.',
        'Пока нет ясного сообщения для клиента.',
        '1. Сформулировать оффер.',
        '2. Собрать черновик страницы.',
        '3. Проверить первые заявки.',
      ].join('\n'),
      usedFallback: false,
    });

    assert.equal(view.source, 'ai');
    assert.equal(buildDevSourceLabel(view.source), 'AI response');
    assert.equal(buildFirstResultDevNotice(view.source), null);
    assert.match(view.headline, /оффер/);
    assert.match(view.firstAction ?? '', /оффер/);
    assert.equal(view.plan.length, 1);
    assert.match(view.nextStep ?? '', /заявки/);
  });
});
