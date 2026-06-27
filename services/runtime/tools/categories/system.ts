import type { RegisteredToolInput } from '@/services/runtime/tools/tool-types';
import {
  DEFAULT_READ_APPROVAL,
  DEFAULT_READ_RETRY_POLICY,
} from '@/services/runtime/tools/tool-types';

export const systemTools: RegisteredToolInput[] = [
  {
    id: 'runtime.info',
    name: 'Runtime Info',
    description: 'Return runtime metadata for the current agent execution.',
    version: '1.0.0',
    category: 'system',
    permissions: {
      requiredFlags: [],
      categoryDefault: true,
    },
    approvalPolicy: DEFAULT_READ_APPROVAL,
    timeoutMs: 5_000,
    retryPolicy: DEFAULT_READ_RETRY_POLICY,
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        runtimeVersion: { type: 'string' },
        runId: { type: 'string' },
        employeeId: { type: 'string' },
      },
      required: ['runtimeVersion', 'runId', 'employeeId'],
    },
    enabled: true,
  },
];
