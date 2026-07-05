import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { PRODUCT_TELEMETRY_EVENTS, type ProductTelemetryEvent } from '@/types/product-telemetry';

export type TrackProductTelemetryInput = {
  projectId?: string | null;
  event: ProductTelemetryEvent;
  actor: string;
  payload?: Record<string, unknown>;
};

export function trackProductTelemetry(input: TrackProductTelemetryInput): void {
  publishRuntimeEvent(
    {
      projectId: input.projectId ?? null,
      type: PRODUCT_TELEMETRY_EVENTS[input.event],
      actor: input.actor,
      source: 'workspace',
      payload: {
        telemetryEvent: input.event,
        ...input.payload,
      },
    },
    getRuntimeStorage(),
  );
}
