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

    assert.match(source, /Задача/);
    assert.match(source, /Результат выходит/);
    assert.match(source, /OSA<br\/>CORE/);
    assert.match(source, /LIVE ORCHESTRA/);
    assert.match(source, /PRODUCTION LINES/);
    assert.match(source, /bg-\[#0a0e15\]/);
  });

  it('ships animated factory core styles with reduced-motion fallback', () => {
    const source = readFileSync(
      join(
        import.meta.dirname,
        '..',
        '..',
        'components',
        'welcome',
        'WelcomeScreen.module.css',
      ),
      'utf8',
    );

    assert.match(source, /\.cube/);
    assert.match(source, /\.orbitA/);
    assert.match(source, /@keyframes cubeRotate/);
    assert.match(source, /prefers-reduced-motion/);
  });
});
