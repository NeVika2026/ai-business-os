import type { RegisteredToolInput } from '@/services/runtime/tools/tool-types';
import { DEFAULT_READ_APPROVAL } from '@/services/runtime/tools/tool-types';

export const webTools: RegisteredToolInput[] = [
  {
    id: 'web.search',
    name: 'Web Search',
    description: 'Search the public web for current information.',
    version: '1.0.0',
    category: 'web',
    permissions: {
      requiredFlags: ['web_search'],
      categoryDefault: true,
    },
    approvalPolicy: DEFAULT_READ_APPROVAL,
    timeoutMs: 15_000,
    retryPolicy: {
      maxAttempts: 2,
      backoffMs: [500, 1_000],
      retryableErrors: ['EXECUTION_TIMEOUT', 'EXECUTION_NETWORK'],
    },
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', minLength: 1, maxLength: 500 },
        limit: { type: 'integer', minimum: 1, maximum: 10 },
      },
      required: ['query'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        results: { type: 'array' },
        count: { type: 'integer' },
      },
      required: ['results', 'count'],
    },
    enabled: true,
  },
];
