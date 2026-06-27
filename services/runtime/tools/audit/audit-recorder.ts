import type {
  ToolAuditEvent,
  ToolAuditMetadata,
  ToolAuditStatus,
} from '@/services/runtime/tools/audit/audit-types';
import { MOCK_TOOL_EXECUTED_AT } from '@/services/runtime/tools/executor/executor-types';

export interface CreateAuditEventInput {
  traceId: string;
  runId: string;
  toolId: string;
  toolCallId: string;
  status: ToolAuditStatus;
  durationMs: number;
  idempotencyKey: string;
  cached?: boolean;
  retryAttempts?: number;
  error?: {
    code: string;
    message: string;
  };
  executedAt?: string;
}

export class AuditRecorder {
  private readonly events: ToolAuditEvent[] = [];

  createEvent(input: CreateAuditEventInput): ToolAuditEvent {
    return {
      traceId: input.traceId,
      runId: input.runId,
      toolId: input.toolId,
      toolCallId: input.toolCallId,
      status: input.status,
      durationMs: input.durationMs,
      error: input.error,
      idempotencyKey: input.idempotencyKey,
      cached: input.cached ?? false,
      retryAttempts: input.retryAttempts ?? 0,
      executedAt: input.executedAt ?? MOCK_TOOL_EXECUTED_AT,
    };
  }

  record(input: CreateAuditEventInput): ToolAuditMetadata {
    const event = this.createEvent(input);
    this.events.push(event);
    return { event };
  }

  list(): ToolAuditEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events.length = 0;
  }
}

export const auditRecorder = new AuditRecorder();
