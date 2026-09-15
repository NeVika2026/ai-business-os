import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { BUSINESS_ZAVOD_NAVIGATION } from '@/utils/platform/business-zavod-config';

describe('Media library', () => {
  it('is present in the main Business Zavod navigation', () => {
    assert.ok(
      BUSINESS_ZAVOD_NAVIGATION.some(
        (item) => item.label === 'Медиа' && item.href === '/media',
      ),
    );
  });

  it('renders saved video, image and audio assets from private storage', () => {
    const source = readFileSync(
      join(import.meta.dirname, '..', '..', 'components', 'media', 'MediaLibrary.tsx'),
      'utf8',
    );

    assert.match(source, /Все готовые медиа/);
    assert.match(source, /Видео/);
    assert.match(source, /Изображения/);
    assert.match(source, /Аудио/);
    assert.match(source, /Открыть файл/);
    assert.match(source, /Медиатека пока пустая/);
  });

  it('loads media_assets and refreshes signed private URLs server-side', () => {
    const source = readFileSync(
      join(import.meta.dirname, '..', '..', 'utils', 'media', 'load-media-library.ts'),
      'utf8',
    );

    assert.match(source, /from\('media_assets'\)/);
    assert.match(source, /refreshPersistedMediaUrl/);
    assert.match(source, /organization_id/);
  });
});
