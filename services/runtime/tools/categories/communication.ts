import type { RegisteredToolInput } from '@/services/runtime/tools/tool-types';
import {
  DEFAULT_EXTERNAL_APPROVAL,
  DEFAULT_WRITE_RETRY_POLICY,
} from '@/services/runtime/tools/tool-types';

export const communicationTools: RegisteredToolInput[] = [
  {
    id: 'email.send',
    name: 'Send Email',
    description: 'Send an email message on behalf of the organization.',
    version: '1.0.0',
    category: 'communication',
    permissions: {
      requiredFlags: ['can_send_email'],
      categoryDefault: true,
    },
    approvalPolicy: DEFAULT_EXTERNAL_APPROVAL,
    timeoutMs: 60_000,
    retryPolicy: DEFAULT_WRITE_RETRY_POLICY,
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', format: 'email' },
        subject: { type: 'string', minLength: 1, maxLength: 200 },
        body: { type: 'string', minLength: 1, maxLength: 10_000 },
      },
      required: ['to', 'subject', 'body'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        messageId: { type: 'string' },
        sent: { type: 'boolean' },
      },
      required: ['sent'],
    },
    enabled: true,
  },
  {
    id: 'telegram.send',
    name: 'Send Telegram Message',
    description: 'Send a Telegram message through an configured integration.',
    version: '1.0.0',
    category: 'communication',
    permissions: {
      requiredFlags: ['can_send_telegram'],
      categoryDefault: true,
    },
    approvalPolicy: DEFAULT_EXTERNAL_APPROVAL,
    timeoutMs: 60_000,
    retryPolicy: DEFAULT_WRITE_RETRY_POLICY,
    inputSchema: {
      type: 'object',
      properties: {
        chat_id: { type: 'string', minLength: 1 },
        message: { type: 'string', minLength: 1, maxLength: 4_000 },
      },
      required: ['chat_id', 'message'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        messageId: { type: 'string' },
        sent: { type: 'boolean' },
      },
      required: ['sent'],
    },
    enabled: true,
  },
];
