import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..', '..');

describe('Business Zavod platform discovery UI', () => {
  it('ships a reusable task catalog with accessible task links', () => {
    const path = join(ROOT, 'components', 'platform', 'PlatformTaskCatalog.tsx');
    assert.equal(existsSync(path), true);

    const source = readFileSync(path, 'utf8');
    assert.match(source, /aria-label/);
    assert.match(source, /\/home\?prompt=/);
  });

  it('ships the guided marketing pack builder from the marketing-ai prototype', () => {
    const builderPath = join(ROOT, 'components', 'platform', 'MarketingPackBuilder.tsx');
    const pagePath = join(
      ROOT,
      'app',
      '(dashboard)',
      'modules',
      'promote',
      'marketing-pack',
      'page.tsx',
    );

    assert.equal(existsSync(builderPath), true);
    assert.equal(existsSync(pagePath), true);

    const builderSource = readFileSync(builderPath, 'utf8');
    assert.match(builderSource, /MARKETING_CHANNELS/);
    assert.match(builderSource, /buildMarketingPackPrompt/);
    assert.match(builderSource, /router\.push/);
  });

  it('ships Create Studio with direct production consoles', () => {
    const studioPath = join(ROOT, 'components', 'platform', 'CreateStudio.tsx');
    const pagePath = join(
      ROOT,
      'app',
      '(dashboard)',
      'modules',
      'create',
      'studio',
      'page.tsx',
    );

    assert.equal(existsSync(studioPath), true);
    assert.equal(existsSync(pagePath), true);

    const studioSource = readFileSync(studioPath, 'utf8');
    assert.match(studioSource, /CREATE_STUDIO_MODES/);
    assert.match(studioSource, /MediaProductionConsole/);
    assert.match(studioSource, /WebsiteProductionConsole/);
    assert.match(studioSource, /getCreateStudioProductionLine/);
  });

  it('ships a server-backed integrations dashboard without exposing env values', () => {
    const dashboardPath = join(
      ROOT,
      'components',
      'platform',
      'IntegrationsDashboard.tsx',
    );
    const settingsPath = join(
      ROOT,
      'app',
      '(dashboard)',
      'settings',
      'page.tsx',
    );

    assert.equal(existsSync(dashboardPath), true);
    assert.equal(existsSync(settingsPath), true);

    const dashboardSource = readFileSync(dashboardPath, 'utf8');
    const settingsSource = readFileSync(settingsPath, 'utf8');

    assert.match(settingsSource, /resolveIntegrationStatuses/);
    assert.match(settingsSource, /process\.env/);
    assert.match(settingsSource, /IntegrationsDashboard/);
    assert.match(dashboardSource, /connected/);
    assert.match(dashboardSource, /missing/);
    assert.match(dashboardSource, /built_in/);
    assert.doesNotMatch(dashboardSource, /process\.env/);
  });

  it('ships a generic module landing route', () => {
    const path = join(ROOT, 'app', '(dashboard)', 'modules', '[module]', 'page.tsx');
    assert.equal(existsSync(path), true);

    const source = readFileSync(path, 'utf8');
    const landingSource = readFileSync(
      join(ROOT, 'components', 'platform', 'ModuleLanding.tsx'),
      'utf8',
    );

    assert.match(source, /getPlatformModule/);
    assert.match(source, /ModuleLanding/);
    assert.match(source, /notFound/);
    assert.match(landingSource, /PlatformTaskCatalog/);
  });
});
