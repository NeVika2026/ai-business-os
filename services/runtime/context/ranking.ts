export function mockScore(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  const normalized = Math.abs(hash % 1000) / 1000;
  return Number(normalized.toFixed(4));
}

export function rankByScore<T>(
  items: T[],
  scoreFn: (item: T) => number,
): Array<T & { score: number }> {
  return items
    .map((item) => ({
      ...item,
      score: scoreFn(item),
    }))
    .sort((left, right) => right.score - left.score);
}
