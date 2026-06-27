import type { ContextPackage } from '@/types/runtime/dto';
import { sanitizeOptionalText, sanitizeText } from '@/services/runtime/prompt/sanitizer';

export function buildEmployeeSection(context: ContextPackage) {
  const { employee } = context;
  const systemPrompt = sanitizeOptionalText(employee.systemPrompt);

  const lines = [
    `[EMPLOYEE PROFILE]`,
    `Name: ${sanitizeText(employee.name)}`,
    `Role: ${sanitizeText(employee.roleTitle)}`,
  ];

  if (systemPrompt) {
    lines.push('', '[EMPLOYEE SYSTEM PROMPT]', systemPrompt);
  }

  const enabledTools = employee.tools.filter((tool) => tool.enabled).map((tool) => tool.id);

  if (enabledTools.length > 0) {
    lines.push('', `Enabled tools: ${enabledTools.join(', ')}`);
  }

  return {
    key: 'employee',
    role: 'system' as const,
    content: lines.join('\n'),
  };
}
