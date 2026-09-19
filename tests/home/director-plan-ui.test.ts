import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..', '..');

describe('Home DirectorPlan UI wiring', () => {
  it('ships a DirectorPlan confirmation panel', () => {
    const path = join(ROOT, 'components', 'home', 'OsaDirectorPlanPanel.tsx');
    assert.equal(existsSync(path), true);

    const source = readFileSync(path, 'utf8');
    assert.match(source, /Команда OSA/);
    assert.match(source, /План работы/);
    assert.match(source, /Запустить план/);
    assert.match(source, /estimatedTime/);
  });

  it('starts real work, handles clarification, and advances the orchestra', () => {
    const path = join(ROOT, 'components', 'home', 'OsaHomeActionScreen.tsx');
    const source = readFileSync(path, 'utf8');

    assert.match(source, /startHomeRealWork/);
    assert.match(source, /result\.status === 'clarify'/);
    assert.match(source, /runOrchestraLoop/);
    assert.match(source, /BusinessFactoryHero/);
  });
});
