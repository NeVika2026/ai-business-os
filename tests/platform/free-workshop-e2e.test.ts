import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildFreeResult } from '@/components/public/FreeToolWorkshop';
import { isProtectedPlatformPath } from '@/utils/security/protected-routes';

test('free workshop creates a usable post from visitor input', () => {
  const output = buildFreeResult('post', 'подбор квартир', 'семьи с детьми');
  assert.match(output, /подбор квартир/);
  assert.match(output, /семьи с детьми/);
  assert.match(output, /ЗАГОЛОВОК/);
});

test('free workshop creates a useful client message', () => {
  const output = buildFreeResult('offer', 'ремонт квартиры', 'собственники');
  assert.match(output, /ремонт квартиры/);
  assert.match(output, /собственники/);
});

test('free workshop builds all seven days', () => {
  const output = buildFreeResult('plan', 'страхование недвижимости', 'заёмщики');
  for (const day of [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
    'Воскресенье',
  ]) {
    assert.match(output, new RegExp(day));
  }
});

test('missing visitor input does not produce a result', () => {
  assert.equal(buildFreeResult('post', '', 'предприниматели'), '');
  assert.equal(buildFreeResult('offer', 'услуга', '   '), '');
});

test('academy and private routes require authentication', () => {
  for (const path of [
    '/academy',
    '/academy/lesson',
    '/cabinet',
    '/home',
    '/crm',
    '/workspace',
    '/dashboard',
  ]) {
    assert.equal(isProtectedPlatformPath(path), true, path);
  }
  for (const path of ['/', '/gotovoe', '/kursy-nejrosetey', '/login', '/login/sign-in']) {
    assert.equal(isProtectedPlatformPath(path), false, path);
  }
});
