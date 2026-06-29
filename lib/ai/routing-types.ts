import type { ProviderCode } from '@/services/runtime/gateway/types';

export const TASK_CATEGORIES = [
  'coding',
  'business_strategy',
  'research',
  'writing',
  'analysis',
  'planning',
  'summarization',
  'automation',
  'customer_support',
  'creative',
  'unknown',
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export type RoutingProfile =
  | TaskCategory
  | 'long_document'
  | 'marketing_copy'
  | 'fast_reply';

export type LatencyTarget = 'fast' | 'balanced' | 'quality';
export type CostTarget = 'low' | 'balanced' | 'quality';
export type ReasoningComplexity = 'low' | 'medium' | 'high';

export type ProviderRoute = {
  providerCode: ProviderCode;
  modelCode: string;
};

export type RouterInput = {
  intent: string;
  taskCategory: TaskCategory;
  estimatedContextLength: number;
  reasoningComplexity: ReasoningComplexity;
  latencyTarget: LatencyTarget;
  costTarget: CostTarget;
  toolUsage: boolean;
  organizationId: string;
  runId: string;
};

export type RoutingPlan = {
  input: RouterInput;
  routes: ProviderRoute[];
  profile: RoutingProfile;
};

export type RouterMetricRecord = {
  runId: string;
  organizationId: string;
  taskCategory: TaskCategory;
  profile: RoutingProfile;
  provider: ProviderCode;
  model: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  fallbackUsed: boolean;
  success: boolean;
  recordedAt: string;
};

export type RouterPerformanceSnapshot = {
  taskCategory: TaskCategory;
  providerCode: ProviderCode;
  modelCode: string;
  attempts: number;
  successes: number;
  successRate: number;
  avgLatencyMs: number;
  avgCost: number;
};
