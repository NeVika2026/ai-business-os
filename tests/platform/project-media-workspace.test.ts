import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

describe('Project media workspace', () => {
  it('loads and renders project-linked media inside the project workspace', () => {
    const page = readFileSync(
      join(
        import.meta.dirname,
        '..',
        '..',
        'app',
        '(dashboard)',
        'projects',
        '[projectId]',
        'page.tsx',
      ),
      'utf8',
    );
    const workspace = readFileSync(
      join(import.meta.dirname, '..', '..', 'components', 'projects', 'ProjectWorkspace.tsx'),
      'utf8',
    );

    assert.match(page, /loadProjectMedia/);
    assert.match(page, /ProjectWorkspace[\s\S]*workspace={workspace}[\s\S]*media={media}/);
    assert.match(workspace, /ProjectMedia/);
  });

  it('opens the media library prefiltered to the current project', () => {
    const source = readFileSync(
      join(import.meta.dirname, '..', '..', 'components', 'projects', 'ProjectMedia.tsx'),
      'utf8',
    );

    assert.match(source, /\/media\?project=/);
    assert.match(source, /\/modules\/create\/studio\?project=/);
    assert.match(source, /Медиа проекта/);
  });

  it('carries project context through generated media persistence', () => {
    const actions = readFileSync(
      join(
        import.meta.dirname,
        '..',
        '..',
        'app',
        '(dashboard)',
        'modules',
        'create',
        'studio',
        'actions.ts',
      ),
      'utf8',
    );
    const persistence = readFileSync(
      join(
        import.meta.dirname,
        '..',
        '..',
        'services',
        'media',
        'persist-provider-asset.ts',
      ),
      'utf8',
    );

    assert.match(actions, /projectId\?: string \| null/);
    assert.match(actions, /projectId,/);
    assert.match(persistence, /project_id: projectId/);
    assert.match(persistence, /eq\('organization_id', organizationId\)/);
  });

  it('saves the final browser export into the authorized project', () => {
    const source = readFileSync(
      join(
        import.meta.dirname,
        '..',
        '..',
        'components',
        'platform',
        'FinalVideoExportPanel.tsx',
      ),
      'utf8',
    );

    assert.match(source, /getMediaUploadContextAction\(projectId\)/);
    assert.match(source, /project_id: context\.projectId/);
    assert.match(source, /media\?project=/);
  });
});
