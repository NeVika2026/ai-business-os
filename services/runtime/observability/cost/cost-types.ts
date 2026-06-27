import type { ISODateTime, UUID } from '@/types/runtime/dto';

export interface CostEntry {
  id: UUID;
  organizationId: UUID;
  employeeId: UUID;
  traceId: UUID;
  runId: UUID;
  providerCode: string;
  modelCode: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  createdAt: ISODateTime;
}

export interface CostUsageInput {
  organizationId: UUID;
  employeeId: UUID;
  traceId: UUID;
  runId: UUID;
  providerCode: string;
  modelCode: string;
  inputTokens?: number;
  outputTokens?: number;
  inputText?: string;
  outputText?: string;
  createdAt?: ISODateTime;
}

export interface CostFilter {
  organizationId?: UUID;
  employeeId?: UUID;
  traceId?: UUID;
  runId?: UUID;
  providerCode?: string;
  modelCode?: string;
}

export interface CostTotals {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  currency: string;
  entryCount: number;
  countByProvider: Record<string, number>;
  countByModel: Record<string, number>;
}

export interface SerializedCostEntry {
  id: string;
  organizationId: string;
  employeeId: string;
  traceId: string;
  runId: string;
  providerCode: string;
  modelCode: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  createdAt: string;
}

export interface SerializedCostTotals {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  currency: string;
  entryCount: number;
  countByProvider: Record<string, number>;
  countByModel: Record<string, number>;
}

export interface SerializedCostReport {
  entries: SerializedCostEntry[];
  totals: SerializedCostTotals;
}

export interface CostProvider {
  save(entry: CostEntry): void;
  getById(id: UUID): CostEntry | null;
  list(filter?: CostFilter): CostEntry[];
  reset?(): void;
}

export interface CostTrackerOptions {
  provider?: CostProvider;
}

export interface TokenEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}
