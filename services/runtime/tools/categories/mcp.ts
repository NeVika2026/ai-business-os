import type { RegisteredToolInput } from '@/services/runtime/tools/tool-types';
import { DEFAULT_EXTERNAL_APPROVAL } from '@/services/runtime/tools/tool-types';

export const mcpTools: RegisteredToolInput[] = [
  {
    id: 'mcp.call',
    name: 'MCP Call',
    description: 'Invoke a tool exposed by a connected MCP server.',
    version: '1.0.0',
    category: 'mcp',
    permissions: {
      requiredFlags: ['can_use_mcp'],
      categoryDefault: true,
    },
    approvalPolicy: DEFAULT_EXTERNAL_APPROVAL,
    timeoutMs: 60_000,
    retryPolicy: {
      maxAttempts: 2,
      backoffMs: [500, 1_000],
      retryableErrors: ['EXECUTION_TIMEOUT', 'EXECUTION_NETWORK', 'EXTERNAL_503'],
    },
    inputSchema: {
      type: 'object',
      properties: {
        server_id: { type: 'string', minLength: 1 },
        tool_name: { type: 'string', minLength: 1 },
        arguments: { type: 'object' },
      },
      required: ['server_id', 'tool_name'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        content: {},
        isError: { type: 'boolean' },
      },
      required: ['content'],
    },
    enabled: true,
  },
];
