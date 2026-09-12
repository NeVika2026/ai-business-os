import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildGenericOsaRuntimePayload,
  shouldUseGenericOsaRuntime,
} from '@/utils/osa/generic-runtime';

describe('generic OSA runtime mechanics', () => {
  it('allows generic runtime for non-find-clients tasks when RuntimeBridge is enabled', () => {
    assert.equal(
      shouldUseGenericOsaRuntime({
        runtimeBridgeEnabled: true,
        goalId: 'create_content',
      }),
      true,
    );

    assert.equal(
      shouldUseGenericOsaRuntime({
        runtimeBridgeEnabled: false,
        goalId: 'create_content',
      }),
      false,
    );
  });

  it('keeps find_clients on its specialized path', () => {
    assert.equal(
      shouldUseGenericOsaRuntime({
        runtimeBridgeEnabled: true,
        goalId: 'find_clients',
      }),
      false,
    );
  });

  it('builds a provider-neutral runtime payload with plan, team and project context', () => {
    const payload = buildGenericOsaRuntimePayload({
      preparedInput: {
        userPrompt: 'Собери презентацию для продажи услуги',
        businessDescription: 'B2B-консалтинг',
        selectedAgents: [
          { id: 'business-manager', name: 'Business Manager' },
          { id: 'content', name: 'Content' },
        ],
        executionPlan: {
          stages: [],
          dependencies: {},
          parallelGroups: [],
          estimatedMinutes: 10,
          risks: [],
          executionMode: 'sequential',
          reviewRequired: true,
        },
        goalId: 'create_content',
        goalTitle: 'Создать контент',
        projectId: 'project-1',
      },
      sessionId: 'session-1',
      runId: 'run-1',
    });

    assert.equal(payload.user_prompt, 'Собери презентацию для продажи услуги');
    assert.equal(payload.business_description, 'B2B-консалтинг');
    assert.equal(payload.project_id, 'project-1');
    assert.equal(payload.goal_id, 'create_content');
    assert.equal(payload.session_id, 'session-1');
    assert.equal(payload.run_id, 'run-1');
    assert.deepEqual(payload.selected_agents, [
      { id: 'business-manager', name: 'Business Manager' },
      { id: 'content', name: 'Content' },
    ]);

    const serialized = JSON.stringify(payload);
    assert.doesNotMatch(serialized, /OpenAI|Anthropic|Runway|ElevenLabs/i);
  });
});
