import { calculateCost } from '@/services/runtime/observability/cost/cost-calculator';
import { CostValidationError } from '@/services/runtime/observability/cost/cost-errors';
import {
  aggregateCostEntries,
  serializeCostReport,
} from '@/services/runtime/observability/cost/cost-serializer';
import { resolveTokenCounts } from '@/services/runtime/observability/cost/token-counter';
import type {
  CostEntry,
  CostFilter,
  CostProvider,
  CostTotals,
  CostTrackerOptions,
  CostUsageInput,
  SerializedCostReport,
} from '@/services/runtime/observability/cost/cost-types';
import {
  createMockCostProvider,
  mockCostProvider,
} from '@/services/runtime/observability/cost/providers/mock-cost-provider';
import type { UUID } from '@/types/runtime/dto';

let costEntrySequence = 0;

function hashSeed(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function createCostEntryId(seed: string): UUID {
  const next = costEntrySequence;
  costEntrySequence += 1;
  const suffix = hashSeed(`cost:${seed}:${next}`).toString(16).padStart(12, '0').slice(0, 12);

  return `0d000001-0000-4000-8000-${suffix}`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateUsageInput(usage: CostUsageInput): void {
  if (!usage || typeof usage !== 'object') {
    throw new CostValidationError('usage must be an object');
  }

  const requiredFields: Array<keyof CostUsageInput> = [
    'organizationId',
    'employeeId',
    'traceId',
    'runId',
    'providerCode',
    'modelCode',
  ];

  for (const field of requiredFields) {
    if (!isNonEmptyString(usage[field])) {
      throw new CostValidationError(`${field} is required`);
    }
  }

  const hasInputTokens = typeof usage.inputTokens === 'number';
  const hasOutputTokens = typeof usage.outputTokens === 'number';
  const hasInputText = isNonEmptyString(usage.inputText);
  const hasOutputText = isNonEmptyString(usage.outputText);

  if (!hasInputTokens && !hasInputText) {
    throw new CostValidationError('inputTokens or inputText is required');
  }

  if (!hasOutputTokens && !hasOutputText) {
    throw new CostValidationError('outputTokens or outputText is required');
  }
}

/**
 * Per-execution cost tracker. Each runtime run should create its own instance
 * via createCostTracker() so accounting state is not shared across concurrent requests.
 */
export class CostTracker {
  constructor(private readonly provider: CostProvider) {}

  record(usage: CostUsageInput): CostEntry {
    validateUsageInput(usage);

    const tokens = resolveTokenCounts(usage);
    const costs = calculateCost(
      usage.providerCode,
      usage.modelCode,
      tokens.inputTokens,
      tokens.outputTokens,
    );
    const createdAt = usage.createdAt ?? new Date().toISOString();
    const id = createCostEntryId(
      `${usage.runId}:${usage.providerCode}:${usage.modelCode}:${createdAt}`,
    );

    const entry: CostEntry = {
      id,
      organizationId: usage.organizationId,
      employeeId: usage.employeeId,
      traceId: usage.traceId,
      runId: usage.runId,
      providerCode: usage.providerCode,
      modelCode: usage.modelCode,
      inputTokens: tokens.inputTokens,
      outputTokens: tokens.outputTokens,
      totalTokens: tokens.totalTokens,
      inputCost: costs.inputCost,
      outputCost: costs.outputCost,
      totalCost: costs.totalCost,
      currency: costs.currency,
      createdAt,
    };

    this.provider.save(entry);
    return entry;
  }

  getByRun(runId: UUID): CostEntry[] {
    return this.provider.list({ runId });
  }

  getByTrace(traceId: UUID): CostEntry[] {
    return this.provider.list({ traceId });
  }

  getTotals(filter?: CostFilter): CostTotals {
    return aggregateCostEntries(this.provider.list(filter));
  }

  serialize(filter?: CostFilter): SerializedCostReport {
    return serializeCostReport(this.provider.list(filter));
  }

  reset(): void {
    this.provider.reset?.();
  }
}

export function createCostTracker(options?: CostTrackerOptions): CostTracker {
  const provider = options?.provider ?? mockCostProvider;
  return new CostTracker(provider);
}

/** Default dev/test singleton. Do not use for concurrent production runtime executions. */
export const costTracker = createCostTracker();

export { createMockCostProvider, mockCostProvider };

export function resetCostEntrySequence(): void {
  costEntrySequence = 0;
}
