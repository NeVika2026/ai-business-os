import type { RegisteredToolInput } from '@/services/runtime/tools/tool-types';
import {
  DEFAULT_READ_APPROVAL,
  DEFAULT_READ_RETRY_POLICY,
} from '@/services/runtime/tools/tool-types';

export const storageTools: RegisteredToolInput[] = [
  {
    id: 'files.read',
    name: 'Read File',
    description: 'Read a file from the allowed workspace root.',
    version: '1.0.0',
    category: 'files',
    permissions: { requiredFlags: ['can_read_files'], categoryDefault: true },
    approvalPolicy: DEFAULT_READ_APPROVAL,
    timeoutMs: 10_000,
    retryPolicy: DEFAULT_READ_RETRY_POLICY,
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', minLength: 1 } },
      required: ['path'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
        size: { type: 'integer' },
      },
      required: ['path', 'content', 'size'],
    },
    enabled: true,
  },
  {
    id: 'files.list',
    name: 'List Directory',
    description: 'List entries in a directory under the allowed workspace root.',
    version: '1.0.0',
    category: 'files',
    permissions: { requiredFlags: ['can_read_files'], categoryDefault: true },
    approvalPolicy: DEFAULT_READ_APPROVAL,
    timeoutMs: 10_000,
    retryPolicy: DEFAULT_READ_RETRY_POLICY,
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        entries: { type: 'array' },
        count: { type: 'integer' },
      },
      required: ['path', 'entries', 'count'],
    },
    enabled: true,
  },
];
