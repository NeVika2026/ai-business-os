import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildFirstResultFallbackPlan,
  buildGuardedFirstDraft,
  buildWorkspaceTaskFallback,
  isClarificationOnlyFirstResult,
  resolveFirstPlanContent,
} from '@/lib/login/first-result-plan';

describe('first result plan', () => {
  it('builds a usable fallback plan from the task', () => {
    const plan = buildFirstResultFallbackPlan('Подготовить план поиска клиентов');

    assert.match(plan, /Подготовить план поиска клиентов/);
    assert.match(plan, /1\./);
    assert.match(plan, /продолжите со мной/);
  });

  it('uses gateway content when available', () => {
    const resolved = resolveFirstPlanContent('Launch landing', '1. Сделать hero\n2. Запустить рекламу');

    assert.equal(resolved.usedFallback, false);
    assert.match(resolved.content, /hero/);
  });

  it('rejects clarification-only AI output and returns a produced video draft', () => {
    const clarification = [
      'Для создания рекламного ролика мне необходимо больше информации.',
      'Пожалуйста, предоставьте следующие данные:',
      'Название продукта.',
      'Основные преимущества.',
      'Как только я получу эти данные, я смогу создать ролик.',
    ].join('\n');

    assert.equal(isClarificationOnlyFirstResult(clarification), true);

    const resolved = resolveFirstPlanContent(
      'Сделай рекламный ролик для моего продукта',
      clarification,
    );

    assert.equal(resolved.usedFallback, false);
    assert.match(resolved.content, /СЦЕНА 1 — ХУК/);
    assert.match(resolved.content, /\[ПРОДУКТ\]/);
    assert.doesNotMatch(resolved.content, /необходимо больше информации/i);
  });

  it('builds a deterministic guarded draft for underspecified video tasks', () => {
    const draft = buildGuardedFirstDraft('Сделай видео для продукта');

    assert.match(draft, /РЕКЛАМНЫЙ РОЛИК/);
    assert.match(draft, /Текст|Озвучка|Титр/);
    assert.match(draft, /CTA/);
  });

  it('falls back when gateway content is empty', () => {
    const resolved = resolveFirstPlanContent('Launch landing', '');

    assert.equal(resolved.usedFallback, true);
    assert.match(resolved.content, /Launch landing/);
  });

  it('builds workspace fallback without corporate terminology', () => {
    const plan = buildWorkspaceTaskFallback('Собрать план продаж', 'Landing Page');

    assert.match(plan, /Landing Page/);
    assert.match(plan, /Собрать план продаж/);
    assert.match(plan, /Я набросала первый шаг/);
    assert.doesNotMatch(plan, /Executive Brain|Orchestra|Runtime/i);
  });
});
