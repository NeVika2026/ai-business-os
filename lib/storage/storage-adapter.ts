import type { RuntimeStorage } from './runtime-storage';

export function loadOrThrow<T>(
  storage: RuntimeStorage,
  namespace: string,
  id: string,
  label: string,
): T {
  const value = storage.load<T>(namespace, id);

  if (!value) {
    throw new Error(`${label} not found: ${id}`);
  }

  return value;
}

export function listValues<T>(storage: RuntimeStorage, namespace: string): T[] {
  return storage.listIds(namespace).map((id) => storage.load<T>(namespace, id)!);
}
