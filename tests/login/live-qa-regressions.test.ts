import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

function source(...parts: string[]) {
  return readFileSync(join(import.meta.dirname, '..', '..', ...parts), 'utf8');
}

describe('live QA regressions', () => {
  it('preserves protected destinations through login and magic-link auth', () => {
    const loginPage = source('app', 'login', 'page.tsx');
    const welcome = source('components', 'welcome', 'WelcomeScreen.tsx');
    const signInPage = source('app', 'login', 'sign-in', 'page.tsx');
    const signInForm = source('components', 'welcome', 'SignInForm.tsx');
    const actions = source('app', 'login', 'actions.ts');
    const callback = source('app', 'auth', 'callback', 'route.ts');

    assert.match(loginPage, /params\.next/);
    assert.match(loginPage, /nextPath/);
    assert.match(welcome, /login\/sign-in\?next=/);
    assert.match(signInPage, /params\.next/);
    assert.match(signInForm, /name="next"/);
    assert.match(actions, /safeLoginNext/);
    assert.match(actions, /emailRedirectTo/);
    assert.match(actions, /encodeURIComponent\(nextPath\)/);
    assert.match(callback, /safeNextPath/);
    assert.match(callback, /encodeURIComponent\(next\)/);
  });

  it('carries a generated first-result task into the authenticated home', () => {
    const screen = source('components', 'welcome', 'FirstResultScreen.tsx');

    assert.match(screen, /continueNext/);
    assert.match(screen, /\/home\?prompt=/);
    assert.match(screen, /continueHref/);
    assert.match(screen, /href=\{continueHref\}/);
  });

  it('uses same-origin video delivery and a real portrait source', () => {
    const hero = source('components', 'home', 'BusinessFactoryHero.tsx');
    const mediaRoute = source('app', 'api', 'media', 'chaplin', 'route.ts');

    assert.match(hero, /CHAPLIN_WEBM_URL = '\/api\/media\/chaplin'/);
    assert.match(hero, /src=\{VISUAL_PORTRAIT_URL\}/);
    assert.doesNotMatch(hero, /src="\/media\/mono-portrait\.svg"/);
    assert.match(mediaRoute, /range/);
    assert.match(mediaRoute, /content-range/);
    assert.match(mediaRoute, /The_Champion_1915/);
  });
});
