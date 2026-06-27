import type {
  CostEntry,
  CostFilter,
  CostTotals,
  SerializedCostEntry,
  SerializedCostReport,
  SerializedCostTotals,
} from '@/services/runtime/observability/cost/cost-types';

export function aggregateCostEntries(entries: CostEntry[]): CostTotals {
  const totals: CostTotals = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    currency: entries[0]?.currency ?? 'USD',
    entryCount: entries.length,
    countByProvider: {},
    countByModel: {},
  };

  for (const entry of entries) {
    totals.inputTokens += entry.inputTokens;
    totals.outputTokens += entry.outputTokens;
    totals.totalTokens += entry.totalTokens;
    totals.totalCost = Number((totals.totalCost + entry.totalCost).toFixed(6));
    totals.countByProvider[entry.providerCode] =
      (totals.countByProvider[entry.providerCode] ?? 0) + 1;
    totals.countByModel[entry.modelCode] = (totals.countByModel[entry.modelCode] ?? 0) + 1;
  }

  totals.totalCost = Number(totals.totalCost.toFixed(6));
  return totals;
}

export function serializeCostEntry(entry: CostEntry): SerializedCostEntry {
  return {
    id: entry.id,
    organizationId: entry.organizationId,
    employeeId: entry.employeeId,
    traceId: entry.traceId,
    runId: entry.runId,
    providerCode: entry.providerCode,
    modelCode: entry.modelCode,
    inputTokens: entry.inputTokens,
    outputTokens: entry.outputTokens,
    totalTokens: entry.totalTokens,
    inputCost: entry.inputCost,
    outputCost: entry.outputCost,
    totalCost: entry.totalCost,
    currency: entry.currency,
    createdAt: entry.createdAt,
  };
}

export function serializeCostTotals(totals: CostTotals): SerializedCostTotals {
  return {
    inputTokens: totals.inputTokens,
    outputTokens: totals.outputTokens,
    totalTokens: totals.totalTokens,
    totalCost: totals.totalCost,
    currency: totals.currency,
    entryCount: totals.entryCount,
    countByProvider: { ...totals.countByProvider },
    countByModel: { ...totals.countByModel },
  };
}

export function serializeCostReport(entries: CostEntry[]): SerializedCostReport {
  const totals = aggregateCostEntries(entries);

  return {
    entries: entries.map(serializeCostEntry),
    totals: serializeCostTotals(totals),
  };
}

export function matchesCostFilter(entry: CostEntry, filter?: CostFilter): boolean {
  if (!filter) {
    return true;
  }

  if (filter.organizationId && entry.organizationId !== filter.organizationId) {
    return false;
  }

  if (filter.employeeId && entry.employeeId !== filter.employeeId) {
    return false;
  }

  if (filter.traceId && entry.traceId !== filter.traceId) {
    return false;
  }

  if (filter.runId && entry.runId !== filter.runId) {
    return false;
  }

  if (filter.providerCode && entry.providerCode !== filter.providerCode) {
    return false;
  }

  if (filter.modelCode && entry.modelCode !== filter.modelCode) {
    return false;
  }

  return true;
}
