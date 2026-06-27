/**
 * Deterministic mock token estimator.
 * Uses word count and character length — no external tokenizer libraries.
 */
export function estimateTokensFromText(text: string): number {
  const normalized = text.trim();

  if (!normalized) {
    return 0;
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  const wordEstimate = Math.ceil(words.length * 1.3);
  const charEstimate = Math.ceil(normalized.length / 4);

  return Math.max(wordEstimate, charEstimate);
}

export function estimateTokenUsage(
  inputText = '',
  outputText = '',
): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
} {
  const inputTokens = estimateTokensFromText(inputText);
  const outputTokens = estimateTokensFromText(outputText);

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

export function resolveTokenCounts(input: {
  inputTokens?: number;
  outputTokens?: number;
  inputText?: string;
  outputText?: string;
}): { inputTokens: number; outputTokens: number; totalTokens: number } {
  const inputTokens =
    typeof input.inputTokens === 'number'
      ? Math.max(0, Math.floor(input.inputTokens))
      : estimateTokensFromText(input.inputText ?? '');

  const outputTokens =
    typeof input.outputTokens === 'number'
      ? Math.max(0, Math.floor(input.outputTokens))
      : estimateTokensFromText(input.outputText ?? '');

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}
