import { getModelPricing } from '@/services/runtime/gateway/pricing';

import type { RouterMetricRecord } from '@/lib/ai/routing-types';
import type { ProviderCode } from '@/services/runtime/gateway/types';

const MAX_METRICS = 500;
const metrics: RouterMetricRecord[] = [];

export function estimateRouterCost(
  providerCode: ProviderCode,
  modelCode: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = getModelPricing(providerCode, modelCode);

  if (!pricing) {
    return 0;
  }

  return (inputTokens / 1000) * pricing.inputPer1k + (outputTokens / 1000) * pricing.outputPer1k;
}

export function recordRouterMetric(record: RouterMetricRecord): void {
  metrics.push(record);

  if (metrics.length > MAX_METRICS) {
    metrics.splice(0, metrics.length - MAX_METRICS);
  }

  if (process.env.NODE_ENV === 'test') {
    return;
  }

  console.info('[model-router]', JSON.stringify({ event: 'router.metric', ...record }));
}

export function getRouterMetrics(limit = 100): RouterMetricRecord[] {
  return metrics.slice(-limit);
}

export function resetRouterMetrics(): void {
  metrics.length = 0;
}
