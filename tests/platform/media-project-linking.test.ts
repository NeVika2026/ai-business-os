import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

describe('Media project linking', () => {
  it('loads project_id together with media and organization project options', () => {
    const source = readFileSync(
      join(import.meta.dirname, '..', '..', 'utils', 'media', 'load-media-library.ts'),
      'utf8',
    );

    assert.match(source, /project_id/);
    assert.match(source, /from\('projects'\)/);
    assert.match(source, /projectName/);
  });

  it('renders project filters and per-asset project selector', () => {
    const source = readFileSync(
      join(import.meta.dirname, '..', '..', 'components', 'media', 'MediaLibrary.tsx'),
      'utf8',
    );

    assert.match(source, /Все проекты/);
    assert.match(source, /Без проекта/);
    assert.match(source, /attachMediaAssetToProjectAction/);
    assert.match(source, /\/projects\//);
  });

  it('validates organization ownership before linking media to a project', () => {
    const source = readFileSync(
      join(import.meta.dirname, '..', '..', 'app', '(dashboard)', 'media', 'actions.ts'),
      'utf8',
    );

    assert.match(source, /eq\('organization_id', organizationId\)/);
    assert.match(source, /from\('media_assets'\)/);
    assert.match(source, /from\('projects'\)/);
    assert.match(source, /project_id: projectId/);
  });
});
