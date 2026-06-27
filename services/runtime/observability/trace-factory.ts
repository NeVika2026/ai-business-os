import type { UUID } from '@/types/runtime/dto';

type TraceIdKind = 'trace' | 'correlation' | 'run' | 'span';

const PREFIX_BY_KIND: Record<TraceIdKind, string> = {
  trace: '09000001',
  correlation: '0a000001',
  run: '0b000001',
  span: '0c000001',
};

let sequence = 0;

function hashSeed(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function resetTraceIdSequence(): void {
  sequence = 0;
}

export function createMockTraceId(kind: TraceIdKind, seed: string): UUID {
  const next = sequence;
  sequence += 1;
  const hash = hashSeed(`${kind}:${seed}:${next}`);
  const suffix = hash.toString(16).padStart(12, '0').slice(0, 12);

  return `${PREFIX_BY_KIND[kind]}-0000-4000-8000-${suffix}`;
}

export function createRootTraceIds(
  organizationId: string,
  employeeId: string,
  startedAt: string,
): { traceId: UUID; correlationId: UUID; runId: UUID; spanId: UUID } {
  const correlationId = createMockTraceId(
    'correlation',
    `${organizationId}:${employeeId}:${startedAt}`,
  );
  const traceId = createMockTraceId('trace', correlationId);
  const runId = createMockTraceId('run', `${correlationId}:root`);
  const spanId = createMockTraceId('span', `${runId}:root`);

  return {
    traceId,
    correlationId,
    runId,
    spanId,
  };
}

export function createChildSpanId(parentSpanId: UUID): UUID {
  return createMockTraceId('span', `${parentSpanId}:child-span`);
}

export function createChildRunIds(
  parentRunId: UUID,
  parentSpanId: UUID,
): { runId: UUID; spanId: UUID } {
  const runId = createMockTraceId('run', `${parentRunId}:child-run`);
  const spanId = createMockTraceId('span', `${parentSpanId}:${runId}:child-run`);

  return {
    runId,
    spanId,
  };
}
