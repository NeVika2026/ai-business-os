import { getModelPricing } from '@/services/runtime/gateway/pricing';
import type { CostBreakdown } from '@/services/runtime/observability/cost/cost-types';

const FALLBACK_PRICING = {
  inputPer1k: 0.001,
  outputPer1k: 0.002,
  currency: 'USD',
} as const;

function roundCost(value: number): number {
  return Number(value.toFixed(6));
}

export function calculateCost(
  providerCode: string,
  modelCode: string,
  inputTokens: number,
  outputTokens: number,
): CostBreakdown {
  const pricing = getModelPricing(providerCode, modelCode) ?? FALLBACK_PRICING;
  const inputCost = roundCost((inputTokens / 1000) * pricing.inputPer1k);
  const outputCost = roundCost((outputTokens / 1000) * pricing.outputPer1k);

  return {
    inputCost,
    outputCost,
    totalCost: roundCost(inputCost + outputCost),
    currency: pricing.currency,
  };
}
