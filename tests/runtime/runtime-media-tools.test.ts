import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { createProductionToolRegistry } from '@/services/runtime/tools/tool-registry';
import {
  ElevenLabsVoiceGenerateHandler,
  ElevenLabsVoiceListHandler,
  ElevenLabsVoiceStatusHandler,
  RunwayTaskStatusHandler,
  RunwayVideoGenerateHandler,
} from '@/services/runtime/tools/handlers/media-handler';

const originalFetch = globalThis.fetch;
const originalRunway = process.env.RUNWAYML_API_SECRET;
const originalElevenLabs = process.env.ELEVENLABS_API_KEY;

const context = {
  organizationId: 'org-media',
  runId: 'run-media',
  traceId: 'trace-media',
  employeeId: 'employee-media',
};

afterEach(() => {
  globalThis.fetch = originalFetch;

  if (originalRunway === undefined) delete process.env.RUNWAYML_API_SECRET;
  else process.env.RUNWAYML_API_SECRET = originalRunway;

  if (originalElevenLabs === undefined) delete process.env.ELEVENLABS_API_KEY;
  else process.env.ELEVENLABS_API_KEY = originalElevenLabs;
});

describe('Media runtime tools', () => {
  it('registers paid generation tools behind approval and read-only status tools without approval', () => {
    const registry = createProductionToolRegistry();

    const video = registry.get('media.video.generate');
    const image = registry.get('media.image.generate');
    const status = registry.get('media.runway.status');
    const voices = registry.get('media.voice.list');

    assert.equal(video?.category, 'media');
    assert.equal(image?.category, 'media');
    assert.equal(video?.approvalPolicy.required, true);
    assert.match(video?.approvalPolicy.reason ?? '', /paid credits/i);
    assert.equal(status?.approvalPolicy.required, false);
    assert.equal(voices?.approvalPolicy.required, false);
  });

  it('starts a real Runway task through the production handler contract', async () => {
    process.env.RUNWAYML_API_SECRET = 'test-runway-secret';
    let capturedUrl = '';
    let capturedMethod = '';

    globalThis.fetch = async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = String(init?.method ?? 'GET');
      return new Response(JSON.stringify({ id: 'task-video-1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    const result = await new RunwayVideoGenerateHandler().execute(
      {
        prompt_text: 'Cinematic apartment interior, slow dolly forward',
        ratio: '768:1280',
        duration: 5,
      },
      context,
    );

    assert.deepEqual(result, {
      taskId: 'task-video-1',
      status: 'pending',
      kind: 'video',
    });
    assert.equal(capturedUrl, 'https://api.dev.runwayml.com/v1/image_to_video');
    assert.equal(capturedMethod, 'POST');
    assert.doesNotMatch(JSON.stringify(result), /test-runway-secret/);
  });

  it('maps finished Runway output URLs as ephemeral assets', async () => {
    process.env.RUNWAYML_API_SECRET = 'test-runway-secret';

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          id: 'task-video-1',
          status: 'SUCCEEDED',
          output: ['https://cdn.example/video.mp4'],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );

    const result = await new RunwayTaskStatusHandler().execute(
      { task_id: 'task-video-1' },
      context,
    );

    assert.equal(result.status, 'SUCCEEDED');
    assert.deepEqual(result.assetUrls, ['https://cdn.example/video.mp4']);
    assert.equal(result.ephemeral, true);
  });

  it('lists voices and starts asynchronous speech generation', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-eleven-secret';
    const calls: string[] = [];

    globalThis.fetch = async (input) => {
      const url = String(input);
      calls.push(url);

      if (url.includes('/v2/voices')) {
        return new Response(
          JSON.stringify({
            voices: [
              {
                voice_id: 'voice-1',
                name: 'Test Voice',
                category: 'professional',
                preview_url: 'https://cdn.example/voice.mp3',
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }

      if (url.endsWith('/v1/flows/text-to-speech')) {
        return new Response(JSON.stringify({ id: 'speech-1', status: 'pending' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          id: 'speech-1',
          status: 'completed',
          output: { url: 'https://cdn.example/final.mp3' },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };

    const voices = await new ElevenLabsVoiceListHandler().execute({ limit: 5 }, context);
    const created = await new ElevenLabsVoiceGenerateHandler().execute(
      { text: 'Привет', voice_id: 'voice-1' },
      context,
    );
    const status = await new ElevenLabsVoiceStatusHandler().execute(
      { generation_id: 'speech-1' },
      context,
    );

    assert.equal(voices.count, 1);
    assert.equal((voices.voices as Array<{ id: string }>)[0]?.id, 'voice-1');
    assert.equal(created.generationId, 'speech-1');
    assert.equal(status.outputUrl, 'https://cdn.example/final.mp3');
    assert.ok(calls.some((url) => url.includes('/v2/voices')));
    assert.doesNotMatch(JSON.stringify({ voices, created, status }), /test-eleven-secret/);
  });
});
