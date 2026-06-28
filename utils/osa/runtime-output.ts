const OUTPUT_TEXT_KEYS = ['content', 'summary', 'message'] as const;

export function extractRuntimeOutputText(output: unknown): string | null {
  if (!output || typeof output !== 'object') {
    return null;
  }

  const record = output as Record<string, unknown>;

  for (const key of OUTPUT_TEXT_KEYS) {
    const value = record[key];

    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

export function extractRuntimeTaskResult(output: unknown): { summary: string; output: string } {
  const text = extractRuntimeOutputText(output);

  if (text) {
    return { summary: text, output: text };
  }

  return {
    summary: 'Task completed via RuntimeBridge',
    output: 'Task completed via RuntimeBridge',
  };
}
