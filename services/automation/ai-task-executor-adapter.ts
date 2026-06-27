import {
  AITaskExecutorAdapterInvalidStateError,
  AITaskExecutorAdapterValidationError,
} from '@/services/automation/ai-task-executor-adapter-errors';
import { serializeAITaskExecutorSnapshot } from '@/services/automation/ai-task-executor-adapter-serializer';
import type {
  AITaskExecutorAdapterOptions,
  AITaskExecutorBackend,
  AITaskExecutorExecutionReport,
  AITaskExecutorMetadataValue,
  AITaskExecutorReport,
  AITaskExecutorResult,
  AITaskExecutorSnapshot,
  AITaskExecutorState,
  AITaskExecutorStatusView,
  AITaskExecutorTask,
  SerializedAITaskExecutorSnapshot,
} from '@/services/automation/ai-task-executor-adapter-types';
import type {
  RoadmapTaskExecutionHandler,
  RoadmapTaskHandlerResult,
  RoadmapTaskInput,
} from '@/services/automation/roadmap-task-executor-types';

const VALID_STATES = new Set<AITaskExecutorState>([
  'idle',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

function normalizeMetadata(
  metadata: Record<string, AITaskExecutorMetadataValue> | undefined,
): Record<string, AITaskExecutorMetadataValue> {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  return { ...metadata };
}

export function createDefaultMockExecutor(): AITaskExecutorBackend {
  return {
    name: 'default-mock-executor',
    version: '1.0.0',
    execute(task) {
      return {
        success: true,
        filesChanged:
          task.files.length > 0 ? [...task.files] : [`services/automation/${task.id}.ts`],
        warnings: [],
        errors: [],
        report: `Mock executed ${task.title}`,
      };
    },
  };
}

export function fromRoadmapTaskInput(task: RoadmapTaskInput): AITaskExecutorTask {
  const metadata = normalizeMetadata(task.metadata);
  const acceptanceCriteria = normalizeStringArray(metadata.acceptanceCriteria);
  const files = normalizeStringArray(metadata.files);
  const description = isNonEmptyString(task.description)
    ? task.description.trim()
    : task.title.trim();

  return {
    id: task.id,
    title: task.title.trim(),
    description,
    acceptanceCriteria,
    files,
    dependencies: [...task.dependencies],
    status: mapRoadmapStatusToExecutorState(task.status),
    metadata,
  };
}

function mapRoadmapStatusToExecutorState(status: RoadmapTaskInput['status']): AITaskExecutorState {
  if (status === 'pending') {
    return 'idle';
  }

  return status;
}

/**
 * Generic adapter for AI coding backends used by autonomous automation.
 */
export class AITaskExecutorAdapter {
  private state: AITaskExecutorState = 'idle';
  private currentTaskId: string | null = null;
  private cancelled = false;
  private reports: AITaskExecutorExecutionReport[] = [];
  private lastResult: AITaskExecutorResult | null = null;
  private snapshot: AITaskExecutorSnapshot;

  constructor(
    private readonly instanceId: string,
    private readonly backend: AITaskExecutorBackend,
  ) {
    this.snapshot = this.createEmptySnapshot();
  }

  validate(task: AITaskExecutorTask): void {
    this.assertTaskFields(task);
  }

  execute(task: AITaskExecutorTask): AITaskExecutorResult {
    this.validate(task);

    if (this.state === 'running') {
      throw new AITaskExecutorAdapterInvalidStateError('adapter is already running');
    }

    const startedAt = nowIso();
    const startMs = Date.now();
    this.state = 'running';
    this.currentTaskId = task.id;
    this.cancelled = false;
    this.updateSnapshot(task.id, null);

    if (this.cancelled) {
      return this.buildCancelledResult(task, startedAt, startMs);
    }

    const backendResult = this.backend.execute(task);
    const finishedAt = nowIso();
    const durationMs = Date.now() - startMs;

    if (this.cancelled) {
      return this.buildCancelledResult(task, startedAt, startMs);
    }

    const success = backendResult.success;
    this.state = success ? 'completed' : 'failed';
    this.currentTaskId = null;

    const report: AITaskExecutorExecutionReport = {
      taskId: task.id,
      title: task.title,
      status: success ? 'completed' : 'failed',
      startedAt,
      finishedAt,
      durationMs,
      filesChanged: [...backendResult.filesChanged],
      warnings: [...backendResult.warnings],
      errors: [...backendResult.errors],
      summary: backendResult.report ?? null,
    };

    const result: AITaskExecutorResult = {
      success,
      durationMs,
      filesChanged: [...backendResult.filesChanged],
      warnings: [...backendResult.warnings],
      errors: [...backendResult.errors],
      report,
      executorName: this.backend.name,
      executorVersion: this.backend.version,
    };

    this.storeResult(result);
    return result;
  }

  status(): AITaskExecutorStatusView {
    return {
      state: this.state,
      currentTaskId: this.currentTaskId,
      executorName: this.backend.name,
      executorVersion: this.backend.version,
      lastSuccess: this.lastResult?.success ?? null,
      updatedAt: nowIso(),
    };
  }

  cancel(): void {
    if (this.state !== 'running') {
      throw new AITaskExecutorAdapterInvalidStateError('adapter is not running');
    }

    this.cancelled = true;
    this.backend.cancel?.();
    this.state = 'cancelled';
    this.currentTaskId = null;
    this.updateSnapshot(null, false);
  }

  report(): AITaskExecutorReport {
    return {
      instanceId: this.instanceId,
      state: this.state,
      executorName: this.backend.name,
      executorVersion: this.backend.version,
      executionCount: this.reports.length,
      completedCount: this.reports.filter((entry) => entry.status === 'completed').length,
      failedCount: this.reports.filter((entry) => entry.status === 'failed').length,
      cancelledCount: this.reports.filter((entry) => entry.status === 'cancelled').length,
      lastTaskId: this.lastResult?.report.taskId ?? null,
      reports: [...this.reports],
    };
  }

  serialize(): SerializedAITaskExecutorSnapshot {
    return serializeAITaskExecutorSnapshot({
      snapshot: this.snapshot,
      lastResult: this.lastResult,
      report: this.report(),
    });
  }

  reset(): void {
    this.state = 'idle';
    this.currentTaskId = null;
    this.cancelled = false;
    this.reports = [];
    this.lastResult = null;
    this.snapshot = this.createEmptySnapshot();
  }

  toRoadmapHandler(): RoadmapTaskExecutionHandler {
    return {
      execute: (task) => this.executeRoadmapTask(task),
    };
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  getBackendName(): string {
    return this.backend.name;
  }

  private executeRoadmapTask(task: RoadmapTaskInput): RoadmapTaskHandlerResult {
    try {
      const result = this.execute(fromRoadmapTaskInput(task));
      return {
        success: result.success,
        filesChanged: [...result.filesChanged],
        warnings: [...result.warnings],
        errors: [...result.errors],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'task execution failed';
      return {
        success: false,
        filesChanged: [],
        warnings: [],
        errors: [message],
      };
    }
  }

  private buildCancelledResult(
    task: AITaskExecutorTask,
    startedAt: string,
    startMs: number,
  ): AITaskExecutorResult {
    const finishedAt = nowIso();
    const durationMs = Date.now() - startMs;
    const report: AITaskExecutorExecutionReport = {
      taskId: task.id,
      title: task.title,
      status: 'cancelled',
      startedAt,
      finishedAt,
      durationMs,
      filesChanged: [],
      warnings: [],
      errors: ['execution cancelled'],
      summary: null,
    };

    const result: AITaskExecutorResult = {
      success: false,
      durationMs,
      filesChanged: [],
      warnings: [],
      errors: ['execution cancelled'],
      report,
      executorName: this.backend.name,
      executorVersion: this.backend.version,
    };

    this.currentTaskId = null;
    this.storeResult(result);
    return result;
  }

  private assertTaskFields(task: AITaskExecutorTask): void {
    if (!task || typeof task !== 'object') {
      throw new AITaskExecutorAdapterValidationError('task must be an object');
    }

    if (!isNonEmptyString(task.id)) {
      throw new AITaskExecutorAdapterValidationError('task id is required');
    }

    if (!isNonEmptyString(task.title)) {
      throw new AITaskExecutorAdapterValidationError('task title is required');
    }

    if (!isNonEmptyString(task.description)) {
      throw new AITaskExecutorAdapterValidationError('task description is required');
    }

    if (!VALID_STATES.has(task.status)) {
      throw new AITaskExecutorAdapterValidationError(`invalid task state: ${task.status}`);
    }
  }

  private storeResult(result: AITaskExecutorResult): void {
    this.lastResult = result;
    this.reports.push(result.report);
    this.snapshot = {
      instanceId: this.instanceId,
      state: this.state,
      executorName: this.backend.name,
      executorVersion: this.backend.version,
      executionCount: this.reports.length,
      lastTaskId: result.report.taskId,
      lastSuccess: result.success,
      updatedAt: nowIso(),
    };
  }

  private updateSnapshot(taskId: string | null, lastSuccess: boolean | null): void {
    this.snapshot = {
      instanceId: this.instanceId,
      state: this.state,
      executorName: this.backend.name,
      executorVersion: this.backend.version,
      executionCount: this.reports.length,
      lastTaskId: taskId,
      lastSuccess,
      updatedAt: nowIso(),
    };
  }

  private createEmptySnapshot(): AITaskExecutorSnapshot {
    return {
      instanceId: this.instanceId,
      state: 'idle',
      executorName: this.backend.name,
      executorVersion: this.backend.version,
      executionCount: 0,
      lastTaskId: null,
      lastSuccess: null,
      updatedAt: nowIso(),
    };
  }
}

export function createAITaskExecutorAdapter(
  options?: AITaskExecutorAdapterOptions,
): AITaskExecutorAdapter {
  const instanceId = options?.instanceId?.trim() || 'default-ai-task-executor-adapter';
  const backend = options?.executor ?? createDefaultMockExecutor();

  return new AITaskExecutorAdapter(instanceId, backend);
}

/** Default dev/test singleton. Generic AI task executor adapter. */
export const aiTaskExecutorAdapter = createAITaskExecutorAdapter();
