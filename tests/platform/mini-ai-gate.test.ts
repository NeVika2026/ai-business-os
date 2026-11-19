import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isPaidAiConfigured,
  MINI_AI_PRICING,
  PRICING_REVIEW_VERSION,
  validatePaidAiStart,
} from '@/lib/media/mini-ai-gate';

const valid = {
  kind: 'image',
  prompt: 'Сделай рекламный плакат кофейни',
  quotedCredits: MINI_AI_PRICING.image.credits,
  approved: true,
};

test('paid generation is disabled without all operator controls', () => {
  assert.equal(isPaidAiConfigured({}), false);
  assert.equal(isPaidAiConfigured({ BZA_RUNWAY_PAID_ENABLED: 'true' }), false);
  assert.equal(
    isPaidAiConfigured({
      BZA_RUNWAY_PAID_ENABLED: 'true',
      BZA_RUNWAY_PRICING_REVIEWED: '2020-01-01',
      RUNWAYML_API_SECRET: 'test-only',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-only',
    }),
    false,
  );
});

test('paid start fails closed without operator enablement', () => {
  assert.match(validatePaidAiStart(valid, false) || '', /отключена/);
});

test('cost confirmation is mandatory and enforced on server', () => {
  assert.match(validatePaidAiStart({ ...valid, approved: false }, true) || '', /Подтвердите/);
  assert.match(validatePaidAiStart({ ...valid, quotedCredits: 1 }, true) || '', /Тариф/);
  assert.equal(validatePaidAiStart(valid, true), null);
});

test('reject invalid prompt and unsupported tools', () => {
  assert.match(validatePaidAiStart({ ...valid, kind: 'music' }, true) || '', /Неподдерживаемый/);
  assert.match(validatePaidAiStart({ ...valid, prompt: '  ' }, true) || '', /Опишите/);
  assert.match(validatePaidAiStart({ ...valid, prompt: 'x'.repeat(701) }, true) || '', /Опишите/);
});

test('operator must explicitly review current tariff', () => {
  assert.match(PRICING_REVIEW_VERSION, /^20\d\d-\d\d-\d\d$/);
  assert.equal(MINI_AI_PRICING.video.credits, 60);
});
