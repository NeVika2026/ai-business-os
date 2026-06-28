export function normalizeOsaText(input: string): string {
  return ` ${input.trim().toLowerCase().replace(/\s+/g, ' ')} `;
}

export function matchesOsaPattern(text: string, pattern: string): boolean {
  const normalizedPattern = pattern.trim().toLowerCase();

  if (!normalizedPattern) {
    return false;
  }

  if (normalizedPattern.length <= 4) {
    return new RegExp(
      `(?:^|\\s)${normalizedPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$|[.,!?;:])`,
    ).test(text);
  }

  return text.includes(normalizedPattern);
}

export function matchesAnyOsaPattern(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesOsaPattern(text, pattern));
}
