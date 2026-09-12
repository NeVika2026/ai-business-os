import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..', '..');

describe('Business Zavod home experience', () => {
  it('ships the platform sections requested for the first page', () => {
    const path = join(
      ROOT,
      'components',
      'platform',
      'BusinessZavodHomeExperience.tsx',
    );

    assert.equal(existsSync(path), true);

    const source = readFileSync(path, 'utf8');
    assert.match(source, /Что можно запустить/);
    assert.match(source, /Готовые сценарии/);
    assert.match(source, /AI-команда/);
    assert.match(source, /Продолжить работу/);
    assert.match(source, /Магазин возможностей/);
    assert.match(source, /BUSINESS_ZAVOD_MODULES/);
    assert.match(source, /BUSINESS_ZAVOD_TASKS/);
    assert.match(source, /\/marketplace/);
    assert.match(source, /\/settings/);
  });

  it('renders the new experience from the OSA command center', () => {
    const home = readFileSync(
      join(ROOT, 'components', 'home', 'OsaHomeActionScreen.tsx'),
      'utf8',
    );

    assert.match(home, /BusinessZavodHomeExperience/);
  });
});
