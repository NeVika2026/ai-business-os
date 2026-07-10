export type StoredFirstResult = {
  content: string;
  task: string;
  usedFallback: boolean;
  failureReason?: string | null;
};

const RESULTS = new Map<string, StoredFirstResult>();

export function saveFirstResult(
  id: string,
  content: string,
  task: string,
  meta?: {
    usedFallback?: boolean;
    failureReason?: string | null;
  },
): void {
  RESULTS.set(id, {
    content,
    task,
    usedFallback: meta?.usedFallback ?? false,
    failureReason: meta?.failureReason ?? null,
  });
}

export function getFirstResult(id: string | null | undefined): string | null {
  if (!id) {
    return null;
  }

  return RESULTS.get(id)?.content ?? null;
}

export function getFirstResultEntry(id: string | null | undefined): StoredFirstResult | null {
  if (!id) {
    return null;
  }

  return RESULTS.get(id) ?? null;
}
