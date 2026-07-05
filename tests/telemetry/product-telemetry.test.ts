import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { findProjectRuntimeEvents, resetRuntimeEventStore } from '@/lib/events/event-runtime';
import { trackProductTelemetry } from '@/lib/telemetry/product-telemetry';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { PRODUCT_TELEMETRY_EVENTS } from '@/types/product-telemetry';

describe('product telemetry', () => {
  beforeEach(() => {
    resetRuntimeEventStore();
  });

  it('publishes product events to runtime storage', () => {
    trackProductTelemetry({
      projectId: 'project-001',
      event: 'PROJECT_CREATED',
      actor: 'user:alex@example.com',
      payload: { projectType: 'marketing' },
    });

    const events = findProjectRuntimeEvents('project-001', getRuntimeStorage());
    const telemetryEvent = events.find(
      (entry) => entry.type === PRODUCT_TELEMETRY_EVENTS.PROJECT_CREATED,
    );

    assert.ok(telemetryEvent);
    assert.equal(telemetryEvent?.actor, 'user:alex@example.com');
    assert.equal(telemetryEvent?.payload?.telemetryEvent, 'PROJECT_CREATED');
    assert.equal(telemetryEvent?.payload?.projectType, 'marketing');
  });
});
