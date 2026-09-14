import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..', '..');

describe('Business Zavod home experience', () => {
  it('ships the factory sections requested for the first page', () => {
    const path = join(
      ROOT,
      'components',
      'platform',
      'BusinessZavodHomeExperience.tsx',
    );

    assert.equal(existsSync(path), true);

    const source = readFileSync(path, 'utf8');
    assert.match(source, /Цеха Бизнес-Завода/);
    assert.match(source, /Готовые производственные линии/);
    assert.match(source, /AI-сотрудники/);
    assert.match(source, /Продолжить производство/);
    assert.match(source, /Расширение производства/);
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
    assert.match(home, /BusinessFactoryHero/);
    assert.match(home, /BusinessFactoryHome\.module\.css/);
    assert.match(home, /currentTask={prompt}/);
    assert.match(home, /agentName={orchestra\?\.activeAgentName}/);
    assert.match(home, /progress={orchestra\?\.overallProgress}/);
  });
});
