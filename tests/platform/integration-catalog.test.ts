import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  INTEGRATION_CATALOG,
  resolveIntegrationStatuses,
} from '@/utils/platform/integration-catalog';

describe('Business Zavod integration catalog', () => {
  it('reports connected, missing and built-in integrations truthfully', () => {
    const statuses = resolveIntegrationStatuses({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-secret-value',
      OPENAI_API_KEY: 'openai-secret-value',
      RUNWAYML_API_SECRET: '',
      ELEVENLABS_API_KEY: undefined,
    });

    assert.equal(statuses.find((item) => item.id === 'supabase')?.status, 'connected');
    assert.equal(statuses.find((item) => item.id === 'openai')?.status, 'connected');
    assert.equal(statuses.find((item) => item.id === 'runway')?.status, 'missing');
    assert.equal(statuses.find((item) => item.id === 'elevenlabs')?.status, 'missing');
    assert.equal(statuses.find((item) => item.id === 'remotion')?.status, 'built_in');
  });

  it('never returns secret values', () => {
    const statuses = resolveIntegrationStatuses({
      OPENAI_API_KEY: 'do-not-render-this-secret',
      ANTHROPIC_API_KEY: 'another-private-value',
    });

    const serialized = JSON.stringify(statuses);
    assert.doesNotMatch(serialized, /do-not-render-this-secret/);
    assert.doesNotMatch(serialized, /another-private-value/);
    assert.doesNotMatch(serialized, /API_KEY.*:/);
  });

  it('contains the expected provider capabilities', () => {
    const ids = INTEGRATION_CATALOG.map((item) => item.id);

    for (const id of [
      'supabase',
      'openai',
      'anthropic',
      'google-ai',
      'groq',
      'openrouter',
      'fugu',
      'ollama',
      'runway',
      'elevenlabs',
      'remotion',
      'youtube-publish',
      'instagram-publish',
      'tiktok-publish',
      'max-publish',
    ]) {
      assert.ok(ids.includes(id), `missing integration: ${id}`);
    }
  });

  it('reports Instagram connected only with its professional account credentials', () => {
    const missing = resolveIntegrationStatuses({
      INSTAGRAM_USER_ID: '123',
    });
    assert.equal(
      missing.find((item) => item.id === 'instagram-publish')?.status,
      'missing',
    );

    const connected = resolveIntegrationStatuses({
      INSTAGRAM_USER_ID: '123',
      INSTAGRAM_ACCESS_TOKEN: 'token',
    });
    assert.equal(
      connected.find((item) => item.id === 'instagram-publish')?.status,
      'connected',
    );
  });

  it('reports MAX connected only with bot token and chat id', () => {
    const missing = resolveIntegrationStatuses({
      MAX_BOT_TOKEN: 'token',
    });
    assert.equal(
      missing.find((item) => item.id === 'max-publish')?.status,
      'missing',
    );

    const connected = resolveIntegrationStatuses({
      MAX_BOT_TOKEN: 'token',
      MAX_CHAT_ID: '12345',
    });
    assert.equal(
      connected.find((item) => item.id === 'max-publish')?.status,
      'connected',
    );
  });

  it('reports TikTok connected only when all OAuth credentials exist', () => {
    const missing = resolveIntegrationStatuses({
      TIKTOK_CLIENT_KEY: 'key',
      TIKTOK_CLIENT_SECRET: 'secret',
    });
    assert.equal(
      missing.find((item) => item.id === 'tiktok-publish')?.status,
      'missing',
    );

    const connected = resolveIntegrationStatuses({
      TIKTOK_CLIENT_KEY: 'key',
      TIKTOK_CLIENT_SECRET: 'secret',
      TIKTOK_REFRESH_TOKEN: 'refresh',
    });
    assert.equal(
      connected.find((item) => item.id === 'tiktok-publish')?.status,
      'connected',
    );
  });
});
