import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..', '..');

describe('Business Zavod shell integration', () => {
  it('brands the product shell as Бизнес Завод', () => {
    const sidebar = readFileSync(join(ROOT, 'components', 'layout', 'sidebar.tsx'), 'utf8');
    assert.match(sidebar, /Бизнес Завод/);
    assert.doesNotMatch(sidebar, />\s*AI Business OS\s*</);
  });

  it('puts voice input and platform task discovery on Home', () => {
    const home = readFileSync(
      join(ROOT, 'components', 'home', 'OsaHomeActionScreen.tsx'),
      'utf8',
    );

    assert.match(home, /VoiceInputButton/);
    assert.match(home, /PlatformTaskCatalog/);
    assert.match(home, /BUSINESS_ZAVOD_TASKS/);
  });

  it('prefills Home from the prompt query without auto execution', () => {
    const home = readFileSync(
      join(ROOT, 'components', 'home', 'OsaHomeActionScreen.tsx'),
      'utf8',
    );

    assert.match(home, /useSearchParams/);
    assert.match(home, /searchParams\.get\('prompt'\)/);

    assert.match(home, /const initialPrompt = searchParams\.get\('prompt'\)/);
    assert.match(home, /useState\(initialPrompt\)/);

    const prefillBlock = home.match(
      /const initialPrompt = searchParams\.get\('prompt'\)[\s\S]*?const \[phase/,
    )?.[0];

    assert.ok(prefillBlock);
    assert.doesNotMatch(prefillBlock, /runTask|executeRealWork|startHomeRealWork/);
  });
});
