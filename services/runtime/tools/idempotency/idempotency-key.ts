import { createHash } from 'node:crypto';

function stableStringifyValue(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringifyValue(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringifyValue(record[key])}`);

  return `{${entries.join(',')}}`;
}

export function stableStringify(args: Record<string, unknown>): string {
  return stableStringifyValue(args);
}

export function computeIdempotencyKey(
  runId: string,
  toolId: string,
  args: Record<string, unknown>,
): string {
  const payload = `${runId}|${toolId}|${stableStringify(args)}`;
  return createHash('sha256').update(payload).digest('hex');
}
