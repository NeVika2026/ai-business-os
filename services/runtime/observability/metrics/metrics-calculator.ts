export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sum = values.reduce((total, value) => total + value, 0);
  return Number((sum / values.length).toFixed(4));
}

export function percentile(values: number[], percent: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.ceil((percent / 100) * sorted.length) - 1;
  const index = Math.max(0, Math.min(rank, sorted.length - 1));

  return Number(sorted[index].toFixed(4));
}

export function maxValue(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Number(Math.max(...values).toFixed(4));
}

export function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return Number((numerator / denominator).toFixed(4));
}
