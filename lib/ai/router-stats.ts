import type { ProviderRoute, RouterPerformanceSnapshot, TaskCategory } from '@/lib/ai/routing-types';
import type { ProviderCode } from '@/services/runtime/gateway/types';

type StatBucket = {
  attempts: number;
  successes: number;
  totalLatencyMs: number;
  totalCost: number;
};

const MIN_SAMPLES_FOR_LEARNING = 5;
const stats = new Map<string, StatBucket>();

function statKey(taskCategory: TaskCategory, route: ProviderRoute): string {
  return `${taskCategory}:${route.providerCode}:${route.modelCode}`;
}

export function recordRouterOutcome(input: {
  taskCategory: TaskCategory;
  route: ProviderRoute;
  success: boolean;
  latencyMs: number;
  estimatedCost: number;
}): void {
  const key = statKey(input.taskCategory, input.route);
  const current = stats.get(key) ?? {
    attempts: 0,
    successes: 0,
    totalLatencyMs: 0,
    totalCost: 0,
  };

  current.attempts += 1;
  current.successes += input.success ? 1 : 0;
  current.totalLatencyMs += input.latencyMs;
  current.totalCost += input.estimatedCost;

  stats.set(key, current);
}

export function getRouterPerformanceSnapshot(
  taskCategory: TaskCategory,
  route: ProviderRoute,
): RouterPerformanceSnapshot | null {
  const bucket = stats.get(statKey(taskCategory, route));

  if (!bucket || bucket.attempts === 0) {
    return null;
  }

  return {
    taskCategory,
    providerCode: route.providerCode,
    modelCode: route.modelCode,
    attempts: bucket.attempts,
    successes: bucket.successes,
    successRate: bucket.successes / bucket.attempts,
    avgLatencyMs: bucket.totalLatencyMs / bucket.attempts,
    avgCost: bucket.totalCost / bucket.attempts,
  };
}

export function getLearningBoost(
  taskCategory: TaskCategory,
  route: ProviderRoute,
): number {
  const snapshot = getRouterPerformanceSnapshot(taskCategory, route);

  if (!snapshot || snapshot.attempts < MIN_SAMPLES_FOR_LEARNING) {
    return 0;
  }

  return snapshot.successRate * 50 - snapshot.avgLatencyMs / 2000 - snapshot.avgCost * 10;
}

export function resetRouterStats(): void {
  stats.clear();
}

export function listRouterPerformanceSnapshots(): RouterPerformanceSnapshot[] {
  const snapshots: RouterPerformanceSnapshot[] = [];

  for (const [key, bucket] of stats.entries()) {
    const [taskCategory, providerCode, modelCode] = key.split(':') as [
      TaskCategory,
      ProviderCode,
      string,
    ];

    snapshots.push({
      taskCategory,
      providerCode,
      modelCode,
      attempts: bucket.attempts,
      successes: bucket.successes,
      successRate: bucket.successes / bucket.attempts,
      avgLatencyMs: bucket.totalLatencyMs / bucket.attempts,
      avgCost: bucket.totalCost / bucket.attempts,
    });
  }

  return snapshots;
}
