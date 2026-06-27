export type ToolAuditStatus = 'success' | 'failed' | 'cached';

export interface ToolAuditEvent {
  traceId: string;
  runId: string;
  toolId: string;
  toolCallId: string;
  status: ToolAuditStatus;
  durationMs: number;
  error?: {
    code: string;
    message: string;
  };
  idempotencyKey: string;
  cached: boolean;
  retryAttempts: number;
  executedAt: string;
}

export interface ToolAuditMetadata {
  event: ToolAuditEvent;
}
