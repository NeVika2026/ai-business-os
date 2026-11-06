import assert from 'node:assert/strict';
import test from 'node:test';

import { isProtectedPlatformPath } from '../../utils/security/protected-routes';

test('protects cabinet and nested cabinet routes', () => {
  assert.equal(isProtectedPlatformPath('/cabinet'), true);
  assert.equal(isProtectedPlatformPath('/cabinet/offers'), true);
});

test('keeps public discovery routes public', () => {
  assert.equal(isProtectedPlatformPath('/'), false);
  assert.equal(isProtectedPlatformPath('/gotovoe'), false);
  assert.equal(isProtectedPlatformPath('/marketplace'), false);
  assert.equal(isProtectedPlatformPath('/vyyti-v-dengi'), false);
});
