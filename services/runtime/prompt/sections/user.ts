import type { ContextPackage } from '@/types/runtime/dto';
import { removeNullValues, sanitizeText } from '@/services/runtime/prompt/sanitizer';

export function buildUserSection(context: ContextPackage) {
  const payload = removeNullValues(context.userIntent.payload);
  const payloadText = Object.keys(payload).length > 0 ? JSON.stringify(payload, null, 2) : '{}';

  const lines = [
    '[USER REQUEST]',
    `Action: ${sanitizeText(context.userIntent.action)}`,
    'Payload:',
    payloadText,
  ];

  if (context.task) {
    lines.push('', `[TASK] ${sanitizeText(context.task.title)}`);
  }

  return {
    key: 'user',
    role: 'user' as const,
    content: lines.join('\n'),
  };
}
