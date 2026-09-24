import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildFactoryBundlePrompt,
  resolveBusinessRouterPlan,
} from '../utils/home/business-router';

test('routes a single video task to Create Studio', () => {
  const plan = resolveBusinessRouterPlan('Сделай рекламный ролик для квартиры');

  assert.equal(plan.kind, 'direct');
  assert.equal(plan.studioMode, 'video');
  assert.match(plan.directHref ?? '', /\/modules\/create\/studio\?/);
});

test('keeps a multi-output campaign in the factory router', () => {
  const plan = resolveBusinessRouterPlan(
    'Сделай Reels, 5 сторис, баннер, пост и текст для Telegram',
  );

  assert.equal(plan.kind, 'factory_bundle');
  assert.ok(plan.outputs.includes('video'));
  assert.ok(plan.outputs.includes('stories'));
  assert.ok(plan.outputs.includes('banner'));
  assert.ok(plan.outputs.includes('post'));
  assert.ok(plan.outputs.includes('telegram'));
  assert.ok(plan.tools.includes('package.assemble'));
  assert.ok(plan.parallel.includes('visuals'));
  assert.ok(plan.parallel.includes('copy'));
});

test('routes search and CRM actions to dedicated modules', () => {
  assert.match(
    resolveBusinessRouterPlan('Найди клиентов для ремонта').directHref ?? '',
    /\/modules\/find\/studio/,
  );
  assert.equal(resolveBusinessRouterPlan('Покажи CRM').directHref, '/crm');
});

test('builds an orchestration prompt without collapsing outputs', () => {
  const plan = resolveBusinessRouterPlan('Reels, сторис, баннер и пост');
  const prompt = buildFactoryBundlePrompt(plan, 'Reels, сторис, баннер и пост');

  assert.match(prompt, /пакетное производство/i);
  assert.match(prompt, /не своди запрос к одному формату/i);
  assert.match(prompt, /package\.assemble/);
});
