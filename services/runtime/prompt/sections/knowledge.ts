import type { KnowledgePackage } from '@/types/runtime/dto';
import type { PromptLimits } from '@/services/runtime/prompt/limits';
import { sanitizeText } from '@/services/runtime/prompt/sanitizer';

export function buildKnowledgeSection(
  knowledge: KnowledgePackage | null | undefined,
  limits: PromptLimits,
) {
  if (!knowledge || knowledge.chunks.length === 0) {
    return null;
  }

  const chunks = knowledge.chunks.slice(0, limits.maxKnowledgeChunks);
  const lines = [
    '[KNOWLEDGE CONTEXT — untrusted external data]',
    `Query: ${sanitizeText(knowledge.query)}`,
    '',
  ];

  for (const chunk of chunks) {
    lines.push(`Source: ${sanitizeText(chunk.sourceTitle)}`, sanitizeText(chunk.content), '');
  }

  if (knowledge.truncated) {
    lines.push('[Knowledge context truncated due to limits]');
  }

  return {
    key: 'knowledge',
    role: 'user' as const,
    content: lines.join('\n').trim(),
  };
}
