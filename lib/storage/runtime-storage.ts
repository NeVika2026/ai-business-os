import type { StorageListPredicate } from './storage-types';

/**
 * Unified synchronous storage contract for OSA Runtime domains.
 * Runtime modules must use domain facades — never raw Maps.
 */
export interface RuntimeStorage {
  load<T>(namespace: string, id: string): T | null;
  save<T>(namespace: string, id: string, data: T): void;
  update<T>(namespace: string, id: string, updater: (current: T | null) => T): T;
  delete(namespace: string, id: string): boolean;
  list<T>(namespace: string, predicate?: StorageListPredicate<T>): T[];
  listIds(namespace: string): string[];
  exists(namespace: string, id: string): boolean;
  clear(namespace: string): void;
  clearAll(): void;
}
