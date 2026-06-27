import type { CrmSectionItem } from '@/services/runtime/prompt/types';
import type { PromptLimits } from '@/services/runtime/prompt/limits';
import { sanitizeOptionalText, sanitizeText } from '@/services/runtime/prompt/sanitizer';

export function buildCrmSection(items: CrmSectionItem[] | undefined, limits: PromptLimits) {
  if (!items || items.length === 0) {
    return null;
  }

  const leads = items.slice(0, limits.maxCRMItems);
  const lines = ['[CRM CONTEXT]', ''];

  for (const lead of leads) {
    const parts = [
      `Lead: ${sanitizeText(lead.name)}`,
      lead.status ? `Status: ${sanitizeText(lead.status)}` : null,
      lead.email ? `Email: ${sanitizeText(lead.email)}` : null,
      lead.phone ? `Phone: ${sanitizeText(lead.phone)}` : null,
      lead.notes ? `Notes: ${sanitizeOptionalText(lead.notes)}` : null,
    ].filter(Boolean);

    lines.push(`- ${parts.join(' | ')}`);
  }

  return {
    key: 'crm',
    role: 'user' as const,
    content: lines.join('\n'),
  };
}
