import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { MAIN_NAVIGATION, NAVIGATION_HREF_SET } from '@/config/navigation';
import {
  CABINET_LAYOUT,
  CABINET_MODULES,
  CABINET_QUICK_ACTIONS,
  CABINET_ROUTE,
  CABINET_WIDGETS,
  getCabinetNavIndex,
  isCabinetNavigationOrdered,
  SYSTEM_HEALTH_ITEMS,
  SYSTEM_HEALTH_LABELS,
} from '@/utils/cabinet/cabinet-config';

const REPO_ROOT = join(import.meta.dirname, '..', '..');

describe('Personal Cabinet v1.0', () => {
  it('registers cabinet route in navigation above OSA', () => {
    assert.equal(isCabinetNavigationOrdered(), true);
    assert.equal(getCabinetNavIndex('Cabinet'), 1);
    assert.equal(getCabinetNavIndex('OSA'), 2);
    assert.equal(MAIN_NAVIGATION[1]?.href, CABINET_ROUTE);
    assert.equal(NAVIGATION_HREF_SET.has('/cabinet'), true);
  });

  it('defines sidebar navigation items in required order', () => {
    assert.deepEqual(
      MAIN_NAVIGATION.map((item) => item.label),
      ['Home', 'Cabinet', 'OSA', 'Workspace', 'Projects', 'History', 'Settings'],
    );
  });

  it('defines dashboard widgets as placeholders', () => {
    const widgetTitles = CABINET_WIDGETS.map((widget) => widget.title);

    assert.ok(widgetTitles.includes("Today's activity"));
    assert.ok(widgetTitles.includes('Running AI jobs'));
    assert.ok(widgetTitles.includes('Recent projects'));
    assert.ok(widgetTitles.includes('Recent executions'));
    assert.ok(widgetTitles.includes('Quick Start'));
    assert.ok(widgetTitles.includes('Pinned modules'));
    assert.ok(widgetTitles.includes('Recent documents'));
    assert.ok(widgetTitles.includes('Upcoming tasks'));
    assert.ok(widgetTitles.includes('Usage statistics'));
    assert.ok(widgetTitles.includes('AI credits'));
  });

  it('defines quick actions for core operating system flows', () => {
    const labels = CABINET_QUICK_ACTIONS.map((action) => action.label);

    assert.deepEqual(labels, [
      'New Project',
      'Run OSA',
      'Open Workspace',
      'Create AI Team',
      'Import Documents',
      'Connect CRM',
    ]);
  });

  it('defines modular platform modules with OSA pinned', () => {
    const moduleLabels = CABINET_MODULES.map((module) => module.label);

    assert.ok(moduleLabels.includes('OSA'));
    assert.ok(moduleLabels.includes('CRM'));
    assert.ok(moduleLabels.includes('Finance'));
    assert.equal(CABINET_MODULES.find((module) => module.id === 'osa')?.pinned, true);
  });

  it('defines system health statuses', () => {
    const labels = SYSTEM_HEALTH_ITEMS.map((item) => item.label);

    assert.deepEqual(labels, [
      'Runtime',
      'Gateway',
      'Knowledge',
      'Automation',
      'Memory',
      'Database',
    ]);

    for (const item of SYSTEM_HEALTH_ITEMS) {
      assert.ok(SYSTEM_HEALTH_LABELS[item.status]);
    }
  });

  it('uses responsive layout classes for desktop, tablet, and mobile', () => {
    assert.match(CABINET_LAYOUT.page, /max-w-7xl/);
    assert.match(CABINET_LAYOUT.overviewGrid, /grid-cols-1/);
    assert.match(CABINET_LAYOUT.overviewGrid, /md:grid-cols-2/);
    assert.match(CABINET_LAYOUT.overviewGrid, /xl:grid-cols-12/);
    assert.match(CABINET_LAYOUT.moduleGrid, /sm:grid-cols-3/);
    assert.match(CABINET_LAYOUT.moduleGrid, /lg:grid-cols-4/);
    assert.match(CABINET_LAYOUT.healthGrid, /lg:grid-cols-6/);
  });

  it('ships cabinet dashboard component files', () => {
    const componentNames = [
      'DashboardOverview.tsx',
      'RecentActivity.tsx',
      'QuickActions.tsx',
      'ModuleGrid.tsx',
      'WorkspaceCard.tsx',
      'UsageStats.tsx',
      'SystemHealth.tsx',
      'NotificationsPanel.tsx',
      'ProfileSummary.tsx',
    ];

    for (const fileName of componentNames) {
      const filePath = join(REPO_ROOT, 'components', 'cabinet', fileName);
      const source = readFileSync(filePath, 'utf8');

      assert.match(source, /export function/);
    }
  });

  it('renders dashboard overview composition without fake metrics', () => {
    const overviewSource = readFileSync(
      join(REPO_ROOT, 'components', 'cabinet', 'DashboardOverview.tsx'),
      'utf8',
    );
    const profileSource = readFileSync(
      join(REPO_ROOT, 'components', 'cabinet', 'ProfileSummary.tsx'),
      'utf8',
    );

    assert.match(overviewSource, /ProfileSummary/);
    assert.match(overviewSource, /RecentActivity/);
    assert.match(overviewSource, /QuickActions/);
    assert.match(overviewSource, /ModuleGrid/);
    assert.match(overviewSource, /SystemHealth/);
    assert.match(profileSource, /profile\./);
    assert.match(profileSource, /Subscription/);
  });
});
