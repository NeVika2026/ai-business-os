import type { PromptTemplateId } from '@/services/runtime/prompt/types';
import { getTemplate } from '@/services/runtime/prompt/templates';
import { sanitizeText } from '@/services/runtime/prompt/sanitizer';

export function buildSystemSection(templateId: PromptTemplateId = 'default') {
  const template = getTemplate(templateId);

  return {
    key: 'system',
    role: 'system' as const,
    content: sanitizeText(`${template.systemPreamble}\n${template.responseStyle}`),
  };
}
