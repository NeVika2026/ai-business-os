import type { AiOrchestraState } from '@/types/ai-orchestra';

import type { RuntimeStorage } from './runtime-storage';

const NAMESPACE = 'project:orchestra';

export function saveAiOrchestraState(storage: RuntimeStorage, state: AiOrchestraState): void {
  storage.save(NAMESPACE, state.projectId, state);
}

export function loadAiOrchestraState(
  storage: RuntimeStorage,
  projectId: string,
): AiOrchestraState | null {
  return storage.load<AiOrchestraState>(NAMESPACE, projectId);
}

export function clearAiOrchestraNamespace(storage: RuntimeStorage): void {
  storage.clear(NAMESPACE);
}
