import type { RuntimeStorage } from './runtime-storage';
import type { StorageListPredicate, StorageProviderKind } from './storage-types';

type PersistedSnapshot = Record<string, Record<string, unknown>>;

type NodeFs = typeof import('node:fs');
type NodePath = typeof import('node:path');

function getNodeFs(): NodeFs | null {
  if (typeof window !== 'undefined') {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('node:fs') as NodeFs;
  } catch {
    return null;
  }
}

function getNodePath(): NodePath | null {
  if (typeof window !== 'undefined') {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('node:path') as NodePath;
  } catch {
    return null;
  }
}

function defaultPersistPath(): string | null {
  const path = getNodePath();

  if (!path || typeof process === 'undefined') {
    return null;
  }

  return path.join(process.cwd(), '.data', 'runtime-storage.json');
}

function hydrateSnapshot(raw: string): PersistedSnapshot {
  const parsed = JSON.parse(raw) as PersistedSnapshot;

  if (!parsed || typeof parsed !== 'object') {
    return {};
  }

  return parsed;
}

export class MemoryStorageProvider implements RuntimeStorage {
  private readonly buckets = new Map<string, Map<string, unknown>>();
  private readonly persistPath: string | null;

  constructor(options?: { persistent?: boolean; persistPath?: string }) {
    const persistent = options?.persistent ?? false;
    this.persistPath = persistent ? (options?.persistPath ?? defaultPersistPath()) : null;

    if (this.persistPath) {
      this.hydrateFromDisk();
    }
  }

  private bucket(namespace: string): Map<string, unknown> {
    let store = this.buckets.get(namespace);

    if (!store) {
      store = new Map();
      this.buckets.set(namespace, store);
    }

    return store;
  }

  private hydrateFromDisk(): void {
    const fs = getNodeFs();

    if (!this.persistPath || !fs || !fs.existsSync(this.persistPath)) {
      return;
    }

    try {
      const snapshot = hydrateSnapshot(fs.readFileSync(this.persistPath, 'utf8'));

      for (const [namespace, records] of Object.entries(snapshot)) {
        const store = this.bucket(namespace);

        for (const [id, value] of Object.entries(records)) {
          store.set(id, value);
        }
      }
    } catch {
      // Corrupt snapshot should not block runtime startup.
    }
  }

  private flushToDisk(): void {
    const fs = getNodeFs();
    const path = getNodePath();

    if (!this.persistPath || !fs || !path) {
      return;
    }

    const snapshot: PersistedSnapshot = {};

    for (const [namespace, store] of this.buckets.entries()) {
      snapshot[namespace] = Object.fromEntries(store.entries());
    }

    fs.mkdirSync(path.dirname(this.persistPath), { recursive: true });
    fs.writeFileSync(this.persistPath, JSON.stringify(snapshot, null, 2), 'utf8');
  }

  load<T>(namespace: string, id: string): T | null {
    const value = this.bucket(namespace).get(id);
    return (value as T | undefined) ?? null;
  }

  save<T>(namespace: string, id: string, data: T): void {
    this.bucket(namespace).set(id, data as unknown);
    this.flushToDisk();
  }

  update<T>(namespace: string, id: string, updater: (current: T | null) => T): T {
    const next = updater(this.load<T>(namespace, id));
    this.save(namespace, id, next);
    return next;
  }

  delete(namespace: string, id: string): boolean {
    const deleted = this.bucket(namespace).delete(id);

    if (deleted) {
      this.flushToDisk();
    }

    return deleted;
  }

  list<T>(namespace: string, predicate?: StorageListPredicate<T>): T[] {
    const results: T[] = [];

    for (const [id, value] of this.bucket(namespace).entries()) {
      const typed = value as T;

      if (!predicate || predicate(id, typed)) {
        results.push(typed);
      }
    }

    return results;
  }

  listIds(namespace: string): string[] {
    return [...this.bucket(namespace).keys()];
  }

  exists(namespace: string, id: string): boolean {
    return this.bucket(namespace).has(id);
  }

  clear(namespace: string): void {
    this.bucket(namespace).clear();
    this.flushToDisk();
  }

  clearAll(): void {
    this.buckets.clear();
    this.flushToDisk();
  }
}

/** Stub — no database writes until a dedicated migration lands. */
export class SupabaseStorageProvider implements RuntimeStorage {
  load<T>(_namespace: string, _id: string): T | null {
    return null;
  }

  save<T>(_namespace: string, _id: string, _data: T): void {
    // Stub: persistence deferred to Future Database phase.
  }

  update<T>(_namespace: string, _id: string, updater: (current: T | null) => T): T {
    return updater(null);
  }

  delete(_namespace: string, _id: string): boolean {
    return false;
  }

  list<T>(_namespace: string): T[] {
    return [];
  }

  listIds(_namespace: string): string[] {
    return [];
  }

  exists(_namespace: string, _id: string): boolean {
    return false;
  }

  clear(_namespace: string): void {
    // no-op
  }

  clearAll(): void {
    // no-op
  }
}

/** Browser stub — LocalStorage wiring is reserved for client runtime. */
export class LocalStorageProvider implements RuntimeStorage {
  private readonly memory = new MemoryStorageProvider({ persistent: false });

  load<T>(namespace: string, id: string): T | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.memory.load<T>(namespace, id);
    }

    const key = `osa:${namespace}:${id}`;
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  save<T>(namespace: string, id: string, data: T): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.memory.save(namespace, id, data);
      return;
    }

    const key = `osa:${namespace}:${id}`;
    window.localStorage.setItem(key, JSON.stringify(data));
  }

  update<T>(namespace: string, id: string, updater: (current: T | null) => T): T {
    const next = updater(this.load<T>(namespace, id));
    this.save(namespace, id, next);
    return next;
  }

  delete(namespace: string, id: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.memory.delete(namespace, id);
    }

    const key = `osa:${namespace}:${id}`;
    const existed = window.localStorage.getItem(key) !== null;
    window.localStorage.removeItem(key);
    return existed;
  }

  list<T>(namespace: string, predicate?: StorageListPredicate<T>): T[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.memory.list(namespace, predicate);
    }

    const prefix = `osa:${namespace}:`;
    const results: T[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (!key?.startsWith(prefix)) {
        continue;
      }

      const id = key.slice(prefix.length);
      const value = this.load<T>(namespace, id);

      if (value && (!predicate || predicate(id, value))) {
        results.push(value);
      }
    }

    return results;
  }

  listIds(namespace: string): string[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.memory.listIds(namespace);
    }

    const prefix = `osa:${namespace}:`;
    const ids: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (key?.startsWith(prefix)) {
        ids.push(key.slice(prefix.length));
      }
    }

    return ids;
  }

  exists(namespace: string, id: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.memory.exists(namespace, id);
    }

    return window.localStorage.getItem(`osa:${namespace}:${id}`) !== null;
  }

  clear(namespace: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.memory.clear(namespace);
      return;
    }

    for (const id of this.listIds(namespace)) {
      this.delete(namespace, id);
    }
  }

  clearAll(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.memory.clearAll();
      return;
    }

    const keys: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (key?.startsWith('osa:')) {
        keys.push(key);
      }
    }

    for (const key of keys) {
      window.localStorage.removeItem(key);
    }
  }
}

export function createStorageProvider(
  kind: StorageProviderKind,
  options?: { persistent?: boolean; persistPath?: string },
): RuntimeStorage {
  switch (kind) {
    case 'supabase':
      return new SupabaseStorageProvider();
    case 'local':
      return new LocalStorageProvider();
    case 'memory':
    default:
      return new MemoryStorageProvider(options);
  }
}
