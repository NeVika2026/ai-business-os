import type { ProviderRoute, RoutingProfile, TaskCategory } from '@/lib/ai/routing-types';
import type { ProviderCode } from '@/services/runtime/gateway/types';

export type RoutingTable = Record<RoutingProfile, ProviderRoute[]>;

export const DEFAULT_ROUTING_TABLE: RoutingTable = {
  coding: [{ providerCode: 'anthropic', modelCode: 'claude-sonnet-4' }],
  business_strategy: [
    { providerCode: 'fugu', modelCode: 'fugu' },
    { providerCode: 'anthropic', modelCode: 'claude-sonnet-4' },
  ],
  research: [{ providerCode: 'gemini', modelCode: 'gemini-2.0-pro' }],
  writing: [{ providerCode: 'openai', modelCode: 'gpt-4o' }],
  analysis: [{ providerCode: 'anthropic', modelCode: 'claude-sonnet-4' }],
  planning: [
    { providerCode: 'fugu', modelCode: 'fugu' },
    { providerCode: 'anthropic', modelCode: 'claude-sonnet-4' },
  ],
  summarization: [{ providerCode: 'anthropic', modelCode: 'claude-haiku-4' }],
  automation: [{ providerCode: 'openai', modelCode: 'gpt-4o-mini' }],
  customer_support: [{ providerCode: 'anthropic', modelCode: 'claude-haiku-4' }],
  creative: [{ providerCode: 'openai', modelCode: 'gpt-4o' }],
  unknown: [
    { providerCode: 'anthropic', modelCode: 'claude-sonnet-4' },
    { providerCode: 'openai', modelCode: 'gpt-4o-mini' },
    { providerCode: 'gemini', modelCode: 'gemini-2.0-flash' },
  ],
  long_document: [{ providerCode: 'gemini', modelCode: 'gemini-2.0-pro' }],
  marketing_copy: [{ providerCode: 'openai', modelCode: 'gpt-4o' }],
  fast_reply: [{ providerCode: 'anthropic', modelCode: 'claude-haiku-4' }],
};

export const LONG_DOCUMENT_CHAR_THRESHOLD = 32_000;

const FALLBACK_CHAIN: ProviderRoute[] = [
  { providerCode: 'anthropic', modelCode: 'claude-haiku-4' },
  { providerCode: 'openai', modelCode: 'gpt-4o-mini' },
  { providerCode: 'gemini', modelCode: 'gemini-2.0-flash' },
];

let activeRoutingTable: RoutingTable = DEFAULT_ROUTING_TABLE;

function cloneRoutingTable(table: RoutingTable): RoutingTable {
  return Object.fromEntries(
    Object.entries(table).map(([key, routes]) => [key, routes.map((route) => ({ ...route }))]),
  ) as RoutingTable;
}

export function getRoutingTable(): RoutingTable {
  return activeRoutingTable;
}

export function setRoutingTable(table: RoutingTable): void {
  activeRoutingTable = cloneRoutingTable(table);
}

export function resetRoutingTable(): void {
  activeRoutingTable = cloneRoutingTable(DEFAULT_ROUTING_TABLE);
}

export function loadRoutingTableFromEnv(): void {
  const raw = process.env.MODEL_ROUTING_CONFIG?.trim();

  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RoutingTable>;
    activeRoutingTable = {
      ...cloneRoutingTable(DEFAULT_ROUTING_TABLE),
      ...parsed,
    };
  } catch {
    activeRoutingTable = cloneRoutingTable(DEFAULT_ROUTING_TABLE);
  }
}

export function resolveRoutingProfile(input: {
  taskCategory: TaskCategory;
  estimatedContextLength: number;
  latencyTarget: 'fast' | 'balanced' | 'quality';
  intent: string;
}): RoutingProfile {
  if (input.estimatedContextLength >= LONG_DOCUMENT_CHAR_THRESHOLD) {
    return 'long_document';
  }

  if (input.latencyTarget === 'fast') {
    return 'fast_reply';
  }

  const haystack = input.intent.toLowerCase();

  if (/marketing|copy|campaign|ad copy|newsletter/.test(haystack)) {
    return 'marketing_copy';
  }

  return input.taskCategory;
}

export function getConfiguredRoutes(profile: RoutingProfile): ProviderRoute[] {
  return activeRoutingTable[profile] ?? activeRoutingTable.unknown;
}

export function getGlobalFallbackRoutes(): ProviderRoute[] {
  return FALLBACK_CHAIN.map((route) => ({ ...route }));
}

export function mergeRoutes(primary: ProviderRoute[], extras: ProviderRoute[]): ProviderRoute[] {
  const merged: ProviderRoute[] = [];
  const seen = new Set<string>();

  for (const route of [...primary, ...extras]) {
    const key = `${route.providerCode}:${route.modelCode}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(route);
  }

  return merged;
}

export function isKnownProviderCode(value: string): value is ProviderCode {
  return ['openai', 'anthropic', 'gemini', 'groq', 'openrouter', 'ollama', 'fugu'].includes(value);
}
