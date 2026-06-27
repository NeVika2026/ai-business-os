import type { ToolResult } from '@/types/runtime/dto';

export interface IdempotencyRecord {
  key: string;
  result: ToolResult;
  storedAt: string;
}

export interface IdempotencyStoreSnapshot {
  size: number;
  keys: string[];
}
