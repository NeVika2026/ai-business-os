import assert from 'node:assert/strict';
import test from 'node:test';

import { getDataResidencyReadiness } from '../../utils/compliance/data-residency';

test('rejects hosted Supabase cloud for Russian personal-data production', () => {
  const result = getDataResidencyReadiness({
    supabaseUrl: 'https://ebequqojccxyfpixpevd.supabase.co',
    declaredRegion: 'RU',
  });

  assert.equal(result.ready, false);
  assert.equal(result.reason, 'foreign_supabase_cloud');
});

test('accepts a self-hosted Russian Supabase endpoint when RU is declared', () => {
  const result = getDataResidencyReadiness({
    supabaseUrl: 'https://db.business-zavod.ru',
    declaredRegion: 'RU',
  });

  assert.equal(result.ready, true);
  assert.equal(result.reason, null);
});

test('rejects missing RU residency declaration', () => {
  const result = getDataResidencyReadiness({
    supabaseUrl: 'https://db.business-zavod.ru',
    declaredRegion: undefined,
  });

  assert.equal(result.ready, false);
  assert.equal(result.reason, 'region_not_declared_ru');
});
