const activeStreams = new Map<string, AbortController>();

export function registerStreamCancellation(runId: string): AbortSignal {
  cancelStream(runId);
  const controller = new AbortController();
  activeStreams.set(runId, controller);
  return controller.signal;
}

export function cancelStream(runId: string): boolean {
  const controller = activeStreams.get(runId);
  if (!controller) {
    return false;
  }

  controller.abort();
  activeStreams.delete(runId);
  return true;
}

export function clearStreamCancellation(runId: string): void {
  activeStreams.delete(runId);
}

export function resetStreamCancellations(): void {
  for (const controller of activeStreams.values()) {
    controller.abort();
  }
  activeStreams.clear();
}
