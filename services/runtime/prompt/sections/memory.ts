import type { MemoryPackage } from '@/types/runtime/dto';
import type { PromptLimits } from '@/services/runtime/prompt/limits';
import { sanitizeText } from '@/services/runtime/prompt/sanitizer';

export function buildMemorySection(memory: MemoryPackage | null | undefined, limits: PromptLimits) {
  if (!memory || !memory.enabled || memory.entries.length === 0) {
    return null;
  }

  const entries = memory.entries.slice(0, limits.maxMemoryItems);
  const lines = ['[MEMORY — organizational notes]', ''];

  for (const entry of entries) {
    lines.push(
      `- (${sanitizeText(entry.scope)}, importance ${entry.importance.toFixed(2)}) ${sanitizeText(entry.content)}`,
    );
  }

  return {
    key: 'memory',
    role: 'user' as const,
    content: lines.join('\n'),
  };
}
