import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  findProjectRuntimeEvents,
  findRuntimeEvents,
  publishRuntimeEvent,
  resetRuntimeEventStore,
} from '@/lib/events/event-runtime';
import { resetExecutiveState } from '@/lib/executive/executive-state';
import { writeExecutiveDecision } from '@/lib/executive/executive-state';
import { captureGatewayMemory, resetMemoryStore } from '@/lib/memory/memory-engine';
import { runProjectLifecycle } from '@/lib/project-lifecycle/run-project-lifecycle';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { saveNavigatorState } from '@/lib/storage/navigator-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import type { RuntimeEventRecord } from '@/types/event-runtime';

const scope = {
  organizationId: 'org-events',
  userId: 'user-events',
};

function assertEventShape(event: RuntimeEventRecord): void {
  assert.ok(event.id);
  assert.ok(event.timestamp);
  assert.ok(event.type);
  assert.ok(event.actor);
  assert.ok(event.source);
  assert.ok(event.status);
  assert.equal(typeof event.payload, 'object');
}

describe('Event Runtime', () => {
  beforeEach(() => {
    resetMemoryStore();
    resetProjectRuntimeStore();
    resetExecutiveState();
    resetRuntimeEventStore();
  });

  it('publishes events with required fields', () => {
    const event = publishRuntimeEvent({
      projectId: 'project-events-1',
      type: 'test.event',
      actor: 'system:test',
      source: 'workspace',
      payload: { value: 1 },
    });

    assertEventShape(event);
    assert.equal(event.projectId, 'project-events-1');
    assert.equal(event.status, 'completed');

    const stored = findRuntimeEvents(getRuntimeStorage(), (entry) => entry.id === event.id);
    assert.equal(stored.length, 1);
  });

  it('lists project events in reverse chronological order', () => {
    publishRuntimeEvent({
      projectId: 'project-events-2',
      type: 'first.event',
      actor: 'system:test',
      source: 'workspace',
      timestamp: '2026-07-05T08:00:00.000Z',
    });

    publishRuntimeEvent({
      projectId: 'project-events-2',
      type: 'second.event',
      actor: 'system:test',
      source: 'workspace',
      timestamp: '2026-07-05T09:00:00.000Z',
    });

    const events = findProjectRuntimeEvents('project-events-2');

    assert.equal(events.length, 2);
    assert.equal(events[0]?.type, 'second.event');
    assert.equal(events[1]?.type, 'first.event');
  });

  it('executive brain publishes decision events', () => {
    writeExecutiveDecision(scope, {
      goal: 'business_analysis',
      workingMode: 'new_task',
      projectDecision: 'continue_active',
      projectId: 'project-events-3',
      memoryMode: 'project',
      navigatorMode: 'next_step',
      summary: 'Анализ бизнеса · новая задача',
      reasoning: ['goal=business_analysis'],
      confidence: 0.9,
    });

    const events = findRuntimeEvents(
      getRuntimeStorage(),
      (event) => event.source === 'executive_brain',
    );

    assert.equal(events.length, 1);
    assert.equal(events[0]?.type, RUNTIME_EVENT_TYPES.EXECUTIVE_DECISION_RECORDED);
    assert.equal(events[0]?.projectId, 'project-events-3');
  });

  it('memory publishes entry created events', () => {
    captureGatewayMemory({
      task: 'Тестовая задача',
      result: 'Тестовый результат',
      intent: 'business_analysis',
      routingCategory: 'planning',
      organizationId: scope.organizationId,
      userId: scope.userId,
      projectName: 'Event Runtime Memory',
      scope: 'project',
    });

    const events = findRuntimeEvents(getRuntimeStorage(), (event) => event.source === 'memory');

    assert.ok(events.some((event) => event.type === RUNTIME_EVENT_TYPES.MEMORY_ENTRY_CREATED));
    assert.ok(events[0]?.projectId);
  });

  it('navigator publishes state updated events', () => {
    saveNavigatorState(getRuntimeStorage(), {
      organizationId: scope.organizationId,
      userId: scope.userId,
      navigatorMode: 'next_step',
      selectedStepId: 'quick_result',
      lastSuggestedStepId: 'quick_result',
    });

    const events = findRuntimeEvents(getRuntimeStorage(), (event) => event.source === 'navigator');

    assert.equal(events.length, 1);
    assert.equal(events[0]?.type, RUNTIME_EVENT_TYPES.NAVIGATOR_STATE_UPDATED);
  });

  it('project lifecycle publishes started and completed events', () => {
    runProjectLifecycle({
      projectId: 'project-events-5',
      name: 'Event Runtime Alpha',
      description: 'Проверка Event Runtime',
      declaredType: 'general',
      organizationId: scope.organizationId,
      userId: scope.userId,
    });

    const events = findProjectRuntimeEvents('project-events-5');
    const allEvents = findRuntimeEvents(getRuntimeStorage());

    assert.ok(events.some((event) => event.type === RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_STARTED));
    assert.ok(events.some((event) => event.type === RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_COMPLETED));
    assert.ok(events.some((event) => event.type === RUNTIME_EVENT_TYPES.ORCHESTRA_INITIALIZED));
    assert.ok(allEvents.some((event) => event.source === 'memory'));
    assert.ok(allEvents.some((event) => event.source === 'executive_brain'));
    assert.ok(allEvents.some((event) => event.source === 'navigator'));
  });
});
