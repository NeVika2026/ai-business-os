import { createStorageProvider } from './storage-provider';
import type { RuntimeStorage } from './runtime-storage';
import type { StorageFactoryOptions, StorageProviderKind } from './storage-types';

let defaultStorage: RuntimeStorage | null = null;

function resolveProviderKind(): StorageProviderKind {
  const configured = process.env.RUNTIME_STORAGE_PROVIDER?.trim().toLowerCase();

  if (configured === 'supabase') {
    return 'supabase';
  }

  if (configured === 'local') {
    return 'local';
  }

  if (typeof window !== 'undefined') {
    return 'local';
  }

  return 'memory';
}

function shouldPersist(): boolean {
  if (process.env.RUNTIME_STORAGE_PERSIST === 'false') {
    return false;
  }

  if (process.env.RUNTIME_STORAGE_PERSIST === 'true') {
    return true;
  }

  const nodeEnv = process.env.NODE_ENV as string | undefined;

  if (nodeEnv === 'test') {
    return false;
  }

  // Vercel/AWS Lambda application directories are read-only.
  // Runtime state may live in memory for the lifetime of the instance,
  // but it must never try to create process.cwd()/.data on serverless.
  if (process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return false;
  }

  return true;
}

export function createRuntimeStorage(options: StorageFactoryOptions = {}): RuntimeStorage {
  const kind = options.isolated ? 'memory' : resolveProviderKind();

  return createStorageProvider(kind, {
    persistent: options.persistent ?? (options.isolated ? false : shouldPersist()),
    persistPath: options.persistPath,
  });
}

export function getRuntimeStorage(): RuntimeStorage {
  if (!defaultStorage) {
    defaultStorage = createRuntimeStorage();
  }

  return defaultStorage;
}

export function resetRuntimeStorage(): void {
  defaultStorage = createRuntimeStorage({ isolated: true, persistent: false });
}

export function setRuntimeStorageForTests(storage: RuntimeStorage): void {
  defaultStorage = storage;
}
