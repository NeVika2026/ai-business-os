import {
  createChildRunIds,
  createChildSpanId,
  createMockTraceId,
  createRootTraceIds,
} from '@/services/runtime/observability/trace-factory';
import {
  TraceNotFoundError,
  TraceNotLoadedError,
} from '@/services/runtime/observability/trace-errors';
import { serializeTrace } from '@/services/runtime/observability/trace-serializer';
import {
  validateCreateContext,
  validateTraceHierarchy,
  validateTraceRecord,
} from '@/services/runtime/observability/trace-validator';
import type {
  RuntimeTraceRecord,
  SerializedTraceDto,
  TraceChildOptions,
  TraceCreateContext,
  TraceLoadInput,
  TraceManagerOptions,
  TraceProvider,
} from '@/services/runtime/observability/trace-types';
import {
  createMockTraceProvider,
  mockTraceProvider,
} from '@/services/runtime/observability/providers/mock-trace-provider';

function isSpanIdReference(input: TraceLoadInput): input is { spanId: string } {
  return 'spanId' in input && Object.keys(input).length === 1;
}

function resolveLoadedTrace(input: TraceLoadInput, provider: TraceProvider): RuntimeTraceRecord {
  if (isSpanIdReference(input)) {
    const loaded = provider.get(input.spanId);

    if (!loaded) {
      throw new TraceNotFoundError(input.spanId);
    }

    return loaded;
  }

  return input;
}

/**
 * Per-execution trace manager. Each runtime run should create its own instance
 * via createTraceManager() so active trace state is not shared across concurrent requests.
 */
export class TraceManager {
  private currentTrace: RuntimeTraceRecord | null = null;

  constructor(private readonly provider: TraceProvider) {}

  create(context: TraceCreateContext): RuntimeTraceRecord {
    validateCreateContext(context);

    const now = context.startedAt ?? new Date().toISOString();
    const generated = createRootTraceIds(context.organizationId, context.employeeId, now);
    const correlationId = context.correlationId ?? generated.correlationId;
    const traceId = context.traceId ?? generated.traceId;
    const runId = context.runId ?? generated.runId;
    const spanId = createMockTraceId('span', `${runId}:root`);

    const trace: RuntimeTraceRecord = {
      traceId,
      correlationId,
      runId,
      parentRunId: context.parentRunId ?? null,
      spanId,
      parentSpanId: context.parentSpanId ?? null,
      organizationId: context.organizationId,
      employeeId: context.employeeId,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    validateTraceRecord(trace);

    if (trace.parentSpanId) {
      validateTraceHierarchy(trace, this.provider);
    }

    this.provider.save(trace);
    this.currentTrace = trace;
    return trace;
  }

  load(trace: TraceLoadInput): RuntimeTraceRecord {
    const loaded = resolveLoadedTrace(trace, this.provider);
    validateTraceRecord(loaded);

    if (loaded.parentSpanId) {
      validateTraceHierarchy(loaded, this.provider);
    }

    this.currentTrace = loaded;
    return loaded;
  }

  current(): RuntimeTraceRecord {
    if (!this.currentTrace) {
      throw new TraceNotLoadedError();
    }

    return this.currentTrace;
  }

  child(options?: TraceChildOptions): RuntimeTraceRecord {
    const parent = this.current();
    const now = new Date().toISOString();
    const kind = options?.type ?? 'span';

    if (kind === 'span') {
      const childTrace: RuntimeTraceRecord = {
        traceId: parent.traceId,
        correlationId: parent.correlationId,
        runId: parent.runId,
        parentRunId: parent.parentRunId,
        spanId: createChildSpanId(parent.spanId),
        parentSpanId: parent.spanId,
        organizationId: parent.organizationId,
        employeeId: parent.employeeId,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      validateTraceRecord(childTrace);
      validateTraceHierarchy(childTrace, this.provider);
      this.provider.save(childTrace);
      this.currentTrace = childTrace;
      return childTrace;
    }

    const childIds = createChildRunIds(parent.runId, parent.spanId);
    const childTrace: RuntimeTraceRecord = {
      traceId: parent.traceId,
      correlationId: parent.correlationId,
      runId: childIds.runId,
      parentRunId: parent.runId,
      spanId: childIds.spanId,
      parentSpanId: parent.spanId,
      organizationId: parent.organizationId,
      employeeId: parent.employeeId,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    validateTraceRecord(childTrace);
    validateTraceHierarchy(childTrace, this.provider);
    this.provider.save(childTrace);
    this.currentTrace = childTrace;
    return childTrace;
  }

  serialize(): SerializedTraceDto {
    return serializeTrace(this.current());
  }

  isLoaded(): boolean {
    return this.currentTrace !== null;
  }

  reset(): void {
    this.currentTrace = null;
  }
}

export function createTraceManager(options?: TraceManagerOptions): TraceManager {
  const provider = options?.provider ?? mockTraceProvider;
  return new TraceManager(provider);
}

/** Default dev/test singleton. Do not use for concurrent production runtime executions. */
export const traceManager = createTraceManager();

export { createMockTraceProvider, mockTraceProvider };
