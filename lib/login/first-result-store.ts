const RESULTS = new Map<string, string>();

export function saveFirstResult(id: string, content: string): void {
  RESULTS.set(id, content);
}

export function getFirstResult(id: string | null | undefined): string | null {
  if (!id) {
    return null;
  }

  return RESULTS.get(id) ?? null;
}

