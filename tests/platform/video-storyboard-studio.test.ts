
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

describe('Video storyboard production studio', () => {
  it('exposes AI planning, scene generation, voice and Remotion preview', () => {
    const source = readFileSync(
      join(import.meta.dirname, '..', '..', 'components', 'platform', 'VideoStoryboardStudio.tsx'),
      'utf8',
    );

    assert.match(source, /Собрать раскадровку/);
    assert.match(source, /Сгенерировать все сцены по очереди/);
    assert.match(source, /Подтверждаю платную генерацию сцен и озвучки/);
    assert.match(source, /Сгенерировать озвучку/);
    assert.match(source, /StoryboardRemotionPreview/);
    assert.match(source, /Сохранить черновик/);
  });

  it('renders scenes on one Remotion timeline with subtitle overlay and optional audio', () => {
    const source = readFileSync(
      join(import.meta.dirname, '..', '..', 'components', 'platform', 'StoryboardRemotionPreview.tsx'),
      'utf8',
    );

    assert.match(source, /@remotion\/player/);
    assert.match(source, /Sequence/);
    assert.match(source, /Video/);
    assert.match(source, /Audio/);
    assert.match(source, /scene\.narration \|\| scene\.title/);
  });

  it('keeps planning separate from paid generation', () => {
    const source = readFileSync(
      join(
        import.meta.dirname,
        '..',
        '..',
        'app',
        '(dashboard)',
        'modules',
        'create',
        'studio',
        'storyboard-actions.ts',
      ),
      'utf8',
    );

    assert.match(source, /Не запускай генерацию\. Верни только JSON/);
    assert.match(source, /Количество сцен: ровно/);
    assert.match(source, /один визуальный мир/);
  });
});
