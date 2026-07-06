import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildFirstResultFallbackPlan,
  buildWorkspaceTaskFallback,
  resolveFirstPlanContent,
} from '@/lib/login/first-result-plan';

describe('first result plan', () => {
  it('builds a usable fallback plan from the task', () => {
    const plan = buildFirstResultFallbackPlan('Подготовить план поиска клиентов');

    assert.match(plan, /Подготовить план поиска клиентов/);
    assert.match(plan, /1\./);
    assert.match(plan, /Следующее действие/);
  });

  it('uses gateway content when available', () => {
    const resolved = resolveFirstPlanContent('Launch landing', '1. Сделать hero\n2. Запустить рекламу');

    assert.equal(resolved.usedFallback, false);
    assert.match(resolved.content, /hero/);
  });

  it('falls back when gateway content is empty', () => {
    const resolved = resolveFirstPlanContent('Launch landing', '');

    assert.equal(resolved.usedFallback, true);
    assert.match(resolved.content, /Launch landing/);
  });

  it('builds workspace fallback for home and dashboard tasks', () => {
    const plan = buildWorkspaceTaskFallback('Собрать план продаж', 'Landing Page');

    assert.match(plan, /Landing Page/);
    assert.match(plan, /Собрать план продаж/);
    assert.match(plan, /Executive Brain/);
  });
});
