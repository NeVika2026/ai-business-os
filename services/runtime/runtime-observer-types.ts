export type RuntimeObserverEventType =
  | 'runtime.started'
  | 'runtime.finished'
  | 'runtime.failed'
  | 'roadmap.started'
  | 'roadmap.finished'
  | 'sprint.started'
  | 'sprint.finished'
  | 'gateway.called'
  | 'tool.called'
  | 'pipeline.started'
  | 'pipeline.finished'
  | 'memory.read'
  | 'memory.write'
  | 'prompt.compiled';

export const RUNTIME_OBSERVER_EVENT_TYPES: readonly RuntimeObserverEventType[] = [
  'runtime.started',
  'runtime.finished',
  'runtime.failed',
  'roadmap.started',
  'roadmap.finished',
  'sprint.started',
  'sprint.finished',
  'gateway.called',
  'tool.called',
  'pipeline.started',
  'pipeline.finished',
  'memory.read',
  'memory.write',
  'prompt.compiled',
] as const;

export interface RuntimeObserverEmitInput {
  event: RuntimeObserverEventType;
  payload?: Record<string, unknown>;
  duration?: number;
  runId?: string;
}

export interface RuntimeObserverTimelineEntry {
  timestamp: string;
  event: RuntimeObserverEventType;
  payload: Record<string, unknown> | null;
  duration: number | null;
  runId: string | null;
}

export interface RuntimeObserverMetrics {
  runs: number;
  successfulRuns: number;
  failedRuns: number;
  gatewayCalls: number;
  toolCalls: number;
  memoryReads: number;
  memoryWrites: number;
  pipelineRuns: number;
  promptCompiles: number;
  averageDuration: number;
  lastRunDuration: number | null;
}

export interface RuntimeObserverOptions {
  instanceId?: string;
  maxTimelineEntries?: number;
}

export type RuntimeObserverListener = (entry: RuntimeObserverTimelineEntry) => void;

export interface SerializedRuntimeObserverTimelineEntry {
  timestamp: string;
  event: RuntimeObserverEventType;
  payload: Record<string, unknown> | null;
  duration: number | null;
  runId: string | null;
}

export interface SerializedRuntimeObserverMetrics {
  runs: number;
  successfulRuns: number;
  failedRuns: number;
  gatewayCalls: number;
  toolCalls: number;
  memoryReads: number;
  memoryWrites: number;
  pipelineRuns: number;
  promptCompiles: number;
  averageDuration: number;
  lastRunDuration: number | null;
}

export interface RuntimeObserverSnapshot {
  instanceId: string;
  timeline: RuntimeObserverTimelineEntry[];
  metrics: RuntimeObserverMetrics;
  listenerCount: number;
  updatedAt: string;
}

export interface SerializedRuntimeObserverSnapshot {
  instanceId: string;
  timeline: SerializedRuntimeObserverTimelineEntry[];
  metrics: SerializedRuntimeObserverMetrics;
  listenerCount: number;
  updatedAt: string;
}
