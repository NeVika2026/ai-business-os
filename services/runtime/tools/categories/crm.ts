import type { RegisteredToolInput } from '@/services/runtime/tools/tool-types';
import {
  DEFAULT_READ_APPROVAL,
  DEFAULT_READ_RETRY_POLICY,
  DEFAULT_WRITE_APPROVAL,
  DEFAULT_WRITE_RETRY_POLICY,
} from '@/services/runtime/tools/tool-types';

export const crmTools: RegisteredToolInput[] = [
  {
    id: 'crm.search',
    name: 'CRM Search',
    description: 'Search CRM leads and customers for the current organization.',
    version: '1.0.0',
    category: 'crm',
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
        query: { type: 'string', minLength: 1, maxLength: 200 },
        limit: { type: 'integer', minimum: 1, maximum: 50 },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        leads: { type: 'array' },
        count: { type: 'integer' },
      },
      required: ['leads', 'count'],
    },
    enabled: true,
  },
  {
    id: 'crm.create',
    name: 'CRM Create',
    description: 'Create a new CRM lead for the current organization.',
    version: '1.0.0',
    category: 'crm',
    permissions: {
      requiredFlags: ['can_create_leads'],
      categoryDefault: true,
    },
    approvalPolicy: DEFAULT_WRITE_APPROVAL,
    timeoutMs: 30_000,
    retryPolicy: DEFAULT_WRITE_RETRY_POLICY,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 200 },
        email: { type: 'string', format: 'email' },
        status: { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        leadId: { type: 'string', format: 'uuid' },
        created: { type: 'boolean' },
      },
      required: ['leadId', 'created'],
    },
    enabled: true,
  },
  {
    id: 'crm.update',
    name: 'CRM Update',
    description: 'Update an existing CRM lead for the current organization.',
    version: '1.0.0',
    category: 'crm',
    permissions: {
      requiredFlags: ['can_update_leads'],
      categoryDefault: true,
    },
    approvalPolicy: DEFAULT_WRITE_APPROVAL,
    timeoutMs: 30_000,
    retryPolicy: DEFAULT_WRITE_RETRY_POLICY,
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', format: 'uuid' },
        status: { type: 'string' },
        notes: { type: 'string', maxLength: 2_000 },
      },
      required: ['lead_id'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        leadId: { type: 'string', format: 'uuid' },
        updated: { type: 'boolean' },
      },
      required: ['leadId', 'updated'],
    },
    enabled: true,
  },
];
