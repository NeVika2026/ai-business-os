import type {
  IdempotencyRecord,
  IdempotencyStoreSnapshot,
} from '@/services/runtime/tools/idempotency/idempotency-types';
import type { ToolResult } from '@/types/runtime/dto';

export class IdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord>();

  get(key: string): ToolResult | undefined {
    return this.records.get(key)?.result;
  }

  set(key: string, result: ToolResult): void {
    this.records.set(key, {
      key,
      result,
      storedAt: result.audit.executedAt,
    });
  }

  has(key: string): boolean {
    return this.records.has(key);
  }

  delete(key: string): boolean {
    return this.records.delete(key);
  }

  clear(): void {
    this.records.clear();
  }

  snapshot(): IdempotencyStoreSnapshot {
    return {
      size: this.records.size,
      keys: Array.from(this.records.keys()).sort(),
    };
  }
}

export const idempotencyStore = new IdempotencyStore();
