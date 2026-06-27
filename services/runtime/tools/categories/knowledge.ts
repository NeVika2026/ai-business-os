import type { RegisteredToolInput } from '@/services/runtime/tools/tool-types';
import {
  DEFAULT_READ_APPROVAL,
  DEFAULT_READ_RETRY_POLICY,
} from '@/services/runtime/tools/tool-types';

export const knowledgeTools: RegisteredToolInput[] = [
  {
    id: 'knowledge.search',
    name: 'Knowledge Search',
    description: 'Search knowledge chunks for relevant context within the organization.',
    version: '1.0.0',
    category: 'knowledge',
    permissions: {
      requiredFlags: [],
      categoryDefault: true,
    },
    approvalPolicy: DEFAULT_READ_APPROVAL,
    timeoutMs: 30_000,
    retryPolicy: DEFAULT_READ_RETRY_POLICY,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', minLength: 1, maxLength: 500 },
        limit: { type: 'integer', minimum: 1, maximum: 20 },
      },
      required: ['query'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        chunks: { type: 'array' },
        count: { type: 'integer' },
      },
      required: ['chunks', 'count'],
    },
    enabled: true,
  },
];
