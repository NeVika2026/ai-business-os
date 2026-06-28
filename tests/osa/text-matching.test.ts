import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  matchesAnyOsaPattern,
  matchesOsaPattern,
  normalizeOsaText,
} from '@/utils/osa/text-matching';

describe('OSA text matching helpers', () => {
  it('normalizes whitespace and casing', () => {
    assert.equal(normalizeOsaText('  Hello   World  '), ' hello world ');
  });

  it('matches short tokens as whole words', () => {
    const text = normalizeOsaText('Need mlm automation today');

    assert.equal(matchesOsaPattern(text, 'mlm'), true);
    assert.equal(matchesOsaPattern(text, 'asap'), false);
  });

  it('matches any pattern in a list', () => {
    const text = normalizeOsaText('Срочно подготовь план');

    assert.equal(matchesAnyOsaPattern(text, ['срочно', 'завтра']), true);
    assert.equal(matchesAnyOsaPattern(text, ['завтра', 'enterprise']), false);
  });
});
