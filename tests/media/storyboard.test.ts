import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildStoryboardPrompt,
  createStoryboardDraft,
  activateSceneVersion,
  type StoryboardSceneVersion,
} from '@/utils/media/storyboard';

describe('media storyboard mechanics', () => {
  it('creates an editable storyboard skeleton before paid generation', () => {
    const board = createStoryboardDraft({
      title: 'Реклама страхования квартиры',
      goal: 'Привести к заявке',
      durationSeconds: 20,
      ratio: '9:16',
      style: 'чистый современный рекламный ролик',
    });

    assert.equal(board.status, 'draft');
    assert.equal(board.approvedForPaidGeneration, false);
    assert.equal(board.scenes.length, 4);
    assert.equal(board.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0), 20);
    assert.deepEqual(board.outputTargets, ['9:16', '16:9']);
  });

  it('builds a provider-neutral AI prompt for scene planning', () => {
    const prompt = buildStoryboardPrompt({
      goal: 'Продать услугу страхования квартиры',
      audience: 'Владельцы ипотечных квартир',
      durationSeconds: 20,
      ratio: '9:16',
      style: 'реалистичная современная реклама',
    });

    assert.match(prompt, /раскадров/i);
    assert.match(prompt, /сцены/i);
    assert.match(prompt, /камера/i);
    assert.match(prompt, /озвуч/i);
    assert.match(prompt, /JSON/i);
    assert.doesNotMatch(prompt, /Runway|ElevenLabs|OpenAI|Veo|Seedance/i);
  });

  it('keeps multiple scene versions and lets one version become active', () => {
    const board = createStoryboardDraft({
      title: 'Тест',
      goal: 'Тест',
      durationSeconds: 10,
      ratio: '16:9',
    });

    const version: StoryboardSceneVersion = {
      id: 'v2',
      createdAt: '2026-09-14T10:00:00.000Z',
      status: 'ready',
      imageUrl: null,
      videoUrl: 'https://example.com/scene-1-v2.mp4',
      voiceUrl: null,
      providerTaskIds: ['task-2'],
      note: 'Более динамичный дубль',
    };

    const next = activateSceneVersion(board, board.scenes[0]!.id, version);

    assert.equal(next.scenes[0]!.activeVersionId, 'v2');
    assert.equal(next.scenes[0]!.versions.length, 1);
    assert.equal(next.scenes[0]!.versions[0]!.videoUrl, version.videoUrl);
  });
});
