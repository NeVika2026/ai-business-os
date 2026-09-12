import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..', '..');

describe('runtime diagnostics route security', () => {
  it('requires an authenticated Supabase user before exposing diagnostics', () => {
    const source = readFileSync(
      join(ROOT, 'app', 'api', 'runtime', 'diagnostics', 'route.ts'),
      'utf8',
    );

    assert.match(source, /createClient/);
    assert.match(source, /auth\.getUser/);
    assert.match(source, /status:\s*401/);
  });
});
