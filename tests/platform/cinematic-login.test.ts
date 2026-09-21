import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

describe('Cinematic Business Zavod entrance', () => {
  it('renders a dark factory entrance instead of a light office landing', () => {
    const source = readFileSync(
      join(import.meta.dirname, '..', '..', 'components', 'welcome', 'WelcomeScreen.tsx'),
      'utf8',
    );

    assert.match(source, /Превращаем/);
    assert.match(source, /идеи в готовый/);
    assert.match(source, /BusinessFactoryHero/);
    assert.match(source, /LIVE FACTORY/);
    assert.match(source, /PRODUCTION LINES/);
    assert.match(source, /DIRECTOR CONSOLE/);
  });

  it('ships animated factory core styles with reduced-motion fallback', () => {
    const source = readFileSync(
      join(
        import.meta.dirname,
        '..',
        '..',
        'components',
        'home',
        'BusinessFactoryHero.module.css',
      ),
      'utf8',
    );

    assert.match(source, /\.coreRig/);
    assert.match(source, /\.orbitOuter/);
    assert.match(source, /\.module/);
    assert.match(source, /\.miniFilm/);
    assert.match(source, /\.photoDeck/);
    assert.match(source, /@keyframes coreBreathe/);
    assert.match(source, /prefers-reduced-motion/);
  });
});
