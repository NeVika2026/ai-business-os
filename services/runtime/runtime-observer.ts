import { RuntimeObserverValidationError } from '@/services/runtime/runtime-observer-errors';
import {
  createEmptyRuntimeObserverMetrics,
  serializeRuntimeObserverSnapshot,
  serializeRuntimeObserverTimelineEntry,
} from '@/services/runtime/runtime-observer-serializer';
import type {
  RuntimeObserverEmitInput,
  RuntimeObserverListener,
  RuntimeObserverMetrics,
  RuntimeObserverOptions,
  RuntimeObserverSnapshot,
  RuntimeObserverTimelineEntry,
  SerializedRuntimeObserverMetrics,
  SerializedRuntimeObserverSnapshot,
  SerializedRuntimeObserverTimelineEntry,
} from '@/services/runtime/runtime-observer-types';
import { RUNTIME_OBSERVER_EVENT_TYPES as SUPPORTED_EVENTS } from '@/services/runtime/runtime-observer-types';

const DEFAULT_MAX_TIMELINE_ENTRIES = 1000;

function isSupportedEvent(event: string): event is RuntimeObserverEmitInput['event'] {
  return (SUPPORTED_EVENTS as readonly string[]).includes(event);
}

function nullifyPayload(
  payload: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!payload) {
    return null;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    result[key] = value === undefined ? null : value;
  }

  return result;
}

function recordRunDuration(
  metrics: RuntimeObserverMetrics,
  duration: number | null | undefined,
): void {
  if (duration === undefined || duration === null || Number.isNaN(duration)) {
    return;
  }

  const completedRuns = metrics.successfulRuns + metrics.failedRuns;
  metrics.lastRunDuration = duration;
  metrics.averageDuration =
    completedRuns <= 1
      ? duration
      : (metrics.averageDuration * (completedRuns - 1) + duration) / completedRuns;
}

function applyMetrics(metrics: RuntimeObserverMetrics, input: RuntimeObserverEmitInput): void {
  switch (input.event) {
    case 'runtime.started':
      metrics.runs += 1;
      break;
    case 'runtime.finished':
      metrics.successfulRuns += 1;
      recordRunDuration(metrics, input.duration);
      break;
    case 'runtime.failed':
      metrics.failedRuns += 1;
      recordRunDuration(metrics, input.duration);
      break;
    case 'gateway.called':
      metrics.gatewayCalls += 1;
      break;
    case 'tool.called':
      metrics.toolCalls += 1;
      break;
    case 'memory.read':
      metrics.memoryReads += 1;
      break;
    case 'memory.write':
      metrics.memoryWrites += 1;
      break;
    case 'pipeline.finished':
      metrics.pipelineRuns += 1;
      break;
    case 'prompt.compiled':
      metrics.promptCompiles += 1;
      break;
    default:
      break;
  }
}

/**
 * In-memory runtime observer for timeline, metrics, and diagnostics.
 */
export class RuntimeObserver {
  private readonly listeners = new Set<RuntimeObserverListener>();
  private entries: RuntimeObserverTimelineEntry[] = [];
  private aggregatedMetrics: RuntimeObserverMetrics = createEmptyRuntimeObserverMetrics();
  private updatedAt: string = new Date().toISOString();

  constructor(
    private readonly instanceId: string,
    private readonly maxTimelineEntries: number,
  ) {}

  emit(input: RuntimeObserverEmitInput): RuntimeObserverTimelineEntry {
    if (!input || typeof input !== 'object') {
      throw new RuntimeObserverValidationError('emit input must be an object');
    }

    if (!isSupportedEvent(input.event)) {
      throw new RuntimeObserverValidationError(
        `unsupported observer event: ${String(input.event)}`,
      );
    }

    const entry: RuntimeObserverTimelineEntry = {
      timestamp: new Date().toISOString(),
      event: input.event,
      payload: nullifyPayload(input.payload),
      duration: input.duration ?? null,
      runId: input.runId ?? null,
    };

    this.entries.push(entry);

    if (this.entries.length > this.maxTimelineEntries) {
      this.entries = this.entries.slice(this.entries.length - this.maxTimelineEntries);
    }

    applyMetrics(this.aggregatedMetrics, input);
    this.updatedAt = entry.timestamp;

    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch {
        // Listener failures must not affect runtime execution.
      }
    }

    return entry;
  }

  subscribe(listener: RuntimeObserverListener): void {
    if (typeof listener !== 'function') {
      throw new RuntimeObserverValidationError('listener must be a function');
    }

    this.listeners.add(listener);
  }

  unsubscribe(listener: RuntimeObserverListener): void {
    this.listeners.delete(listener);
  }

  timeline(): SerializedRuntimeObserverTimelineEntry[] {
    return this.entries.map(serializeRuntimeObserverTimelineEntry);
  }

  metrics(): SerializedRuntimeObserverMetrics {
    return serializeRuntimeObserverSnapshot(this.buildSnapshot()).metrics;
  }

  lastEvents(limit = 10): SerializedRuntimeObserverTimelineEntry[] {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
    return this.entries.slice(-safeLimit).map(serializeRuntimeObserverTimelineEntry);
  }

  serialize(): SerializedRuntimeObserverSnapshot {
    return serializeRuntimeObserverSnapshot(this.buildSnapshot());
  }

  reset(): void {
    this.entries = [];
    this.aggregatedMetrics = createEmptyRuntimeObserverMetrics();
    this.listeners.clear();
    this.updatedAt = new Date().toISOString();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private buildSnapshot(): RuntimeObserverSnapshot {
    return {
      instanceId: this.instanceId,
      timeline: [...this.entries],
      metrics: { ...this.aggregatedMetrics },
      listenerCount: this.listeners.size,
      updatedAt: this.updatedAt,
    };
  }
}

export function createRuntimeObserver(options?: RuntimeObserverOptions): RuntimeObserver {
  const instanceId = options?.instanceId?.trim() || 'default-observer';
  const maxTimelineEntries = options?.maxTimelineEntries ?? DEFAULT_MAX_TIMELINE_ENTRIES;

  if (!Number.isFinite(maxTimelineEntries) || maxTimelineEntries <= 0) {
    throw new RuntimeObserverValidationError('maxTimelineEntries must be greater than 0');
  }

  return new RuntimeObserver(instanceId, maxTimelineEntries);
}

/** Default dev/test singleton. Do not use for concurrent production observations. */
export const runtimeObserver = createRuntimeObserver();
