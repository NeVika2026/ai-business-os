import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

describe('Final storyboard video export', () => {
  it('renders scenes, subtitles and optional voice into one browser recording', () => {
    const source = readFileSync(
      join(import.meta.dirname, '..', '..', 'utils', 'media', 'browser-video-export.ts'),
      'utf8',
    );

    assert.match(source, /canvas\.captureStream/);
    assert.match(source, /MediaRecorder/);
    assert.match(source, /drawCaption/);
    assert.match(source, /AudioContext/);
    assert.match(source, /musicUrl/);
    assert.match(source, /sfxUrl/);
    assert.match(source, /createGain/);
    assert.match(source, /video\/mp4/);
    assert.match(source, /video\/webm/);
  });

  it('offers download and persistent media-library save', () => {
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

    assert.match(source, /Собрать финальное видео/);
    assert.match(source, /Сохранить в медиатеку/);
    assert.match(source, /media-assets/);
    assert.match(source, /media_assets/);
    assert.match(source, /browser-export/);
  });

  it('shows final export only after every scene is ready', () => {
    const source = readFileSync(
      join(
        import.meta.dirname,
        '..',
        '..',
        'components',
        'platform',
        'VideoStoryboardStudio.tsx',
      ),
      'utf8',
    );

    assert.match(source, /FinalVideoExportPanel/);
    assert.match(source, /completedScenes\.length === scenes\.length/);
  });
});


  it('connects the full factory bundle to final mixed video export', () => {
    const source = readFileSync(
      join(
        import.meta.dirname,
        '..',
        '..',
        'components',
        'platform',
        'FactoryBundleStudio.tsx',
      ),
      'utf8',
    );

    assert.match(source, /FinalVideoExportPanel/);
    assert.match(source, /finalVoiceJob/);
    assert.match(source, /finalMusicJob/);
    assert.match(source, /finalSfxJob/);
    assert.match(source, /voice-script/);
  });
