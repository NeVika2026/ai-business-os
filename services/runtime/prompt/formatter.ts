import type { PromptMessage } from '@/types/runtime/dto';
import type { PromptSectionResult } from '@/services/runtime/prompt/types';
import { sanitizeText } from '@/services/runtime/prompt/sanitizer';

function mergeSystemSections(sections: PromptSectionResult[]): PromptMessage | null {
  const systemSections = sections.filter((section) => section.role === 'system');

  if (systemSections.length === 0) {
    return null;
  }

  const content = systemSections
    .map((section) => sanitizeText(section.content))
    .join('\n\n---\n\n');

  return {
    role: 'system',
    content,
  };
}

function toUserMessages(sections: PromptSectionResult[]): PromptMessage[] {
  return sections
    .filter((section) => section.role === 'user')
    .map((section) => ({
      role: 'user' as const,
      content: sanitizeText(section.content),
    }))
    .filter((message) => message.content.length > 0);
}

export function formatPromptMessages(
  orderedSections: Array<PromptSectionResult | null>,
  conversationHistory: PromptMessage[] = [],
): PromptMessage[] {
  const sections = orderedSections.filter(
    (section): section is PromptSectionResult => section !== null,
  );

  const systemMessage = mergeSystemSections(sections);
  const userMessages = toUserMessages(sections);
  const history = conversationHistory.filter((message) => sanitizeText(message.content).length > 0);

  const messages: PromptMessage[] = [];

  if (systemMessage) {
    messages.push(systemMessage);
  }

  messages.push(...userMessages, ...history);

  return messages;
}
