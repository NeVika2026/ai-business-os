export function sanitizeText(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return value
    .replace(/\0/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function sanitizeOptionalText(value: string | null | undefined): string | null {
  const sanitized = sanitizeText(value);
  return sanitized.length > 0 ? sanitized : null;
}

export function removeNullValues<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined),
  ) as Partial<T>;
}

export function normalizeWhitespace(value: string): string {
  return sanitizeText(value).replace(/[ \t]{2,}/g, ' ');
}
