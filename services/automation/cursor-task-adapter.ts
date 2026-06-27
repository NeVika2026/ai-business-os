import { CursorTaskAdapterValidationError } from '@/services/automation/cursor-task-adapter-errors';
import { serializeCursorTaskAdapterSnapshot } from '@/services/automation/cursor-task-adapter-serializer';
import type {
  CursorExecutionPackage,
  CursorTaskAdapterOptions,
  CursorTaskAdapterReport,
  CursorTaskAdapterSnapshot,
  CursorTaskExecutionResult,
  CursorTaskInput,
  CursorTaskPrepareResult,
  SerializedCursorTaskAdapterSnapshot,
} from '@/services/automation/cursor-task-adapter-types';
import type {
  AITaskExecutorMetadataValue,
  AITaskExecutorTask,
} from '@/services/automation/ai-task-executor-adapter-types';

const DEFAULT_ALLOWED_PATHS = ['services/automation/'];
const DEFAULT_FORBIDDEN_PATHS = [
  'services/runtime/',
  'services/memory/',
  'services/knowledge/',
  'services/gateway/',
  'services/prompt/',
  'services/tool-executor/',
  'database/',
  'app/',
  'components/',
  '.env',
  'node_modules/',
];
const DEFAULT_REQUIRED_CHECKS = [
  'npm run lint',
  'npm run build',
  'npx tsx --test tests/automation/*.test.ts',
];
const DEFAULT_OUTPUT_FORMAT = `Return only:

Created:
Modified:
Fixed:
Risk:
lint:
build:
tests:
git status:
git log --oneline -5

Do not commit.`;

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

function readMetadataStringArray(
  metadata: Record<string, AITaskExecutorMetadataValue>,
  key: string,
): string[] {
  return normalizeStringArray(metadata[key]);
}

function readMetadataString(
  metadata: Record<string, AITaskExecutorMetadataValue>,
  key: string,
  fallback: string,
): string {
  const value = metadata[key];
  return isNonEmptyString(value) ? value.trim() : fallback;
}

export function fromAITaskExecutorTask(task: AITaskExecutorTask): CursorTaskInput {
  const metadata = normalizeMetadata(task.metadata);
  const metadataAllowedPaths = readMetadataStringArray(metadata, 'allowedPaths');
  const metadataForbiddenPaths = readMetadataStringArray(metadata, 'forbiddenPaths');
  const metadataRequiredChecks = readMetadataStringArray(metadata, 'requiredChecks');
  const metadataAcceptanceCriteria = readMetadataStringArray(metadata, 'acceptanceCriteria');

  const allowedPaths =
    metadataAllowedPaths.length > 0
      ? metadataAllowedPaths
      : task.files.length > 0
        ? [...task.files]
        : [...DEFAULT_ALLOWED_PATHS];

  const forbiddenPaths =
    metadataForbiddenPaths.length > 0 ? metadataForbiddenPaths : [...DEFAULT_FORBIDDEN_PATHS];

  const requiredChecks =
    metadataRequiredChecks.length > 0 ? metadataRequiredChecks : [...DEFAULT_REQUIRED_CHECKS];

  const acceptanceCriteria =
    task.acceptanceCriteria.length > 0 ? [...task.acceptanceCriteria] : metadataAcceptanceCriteria;

  const outputFormat = readMetadataString(metadata, 'outputFormat', DEFAULT_OUTPUT_FORMAT);

  return {
    id: task.id,
    title: task.title.trim(),
    description: task.description.trim(),
    acceptanceCriteria,
    allowedPaths,
    forbiddenPaths,
    requiredChecks,
    outputFormat,
    files: [...task.files],
    metadata,
  };
}

function buildPrompt(task: CursorTaskInput): string {
  const acceptanceLines =
    task.acceptanceCriteria.length > 0
      ? task.acceptanceCriteria.map((criterion) => `- ${criterion}`).join('\n')
      : '- Complete the task as described.';

  const allowedLines = task.allowedPaths.map((entry) => `- ${entry}`).join('\n');
  const forbiddenLines = task.forbiddenPaths.map((entry) => `- ${entry}`).join('\n');
  const checkLines = task.requiredChecks.map((entry) => `- ${entry}`).join('\n');

  return [
    '# Goal',
    '',
    task.title,
    '',
    task.description,
    '',
    '## Acceptance Criteria',
    acceptanceLines,
    '',
    '## Allowed files',
    allowedLines,
    '',
    '## Forbidden files',
    forbiddenLines,
    '',
    '## Steps',
    `1. Read the goal and acceptance criteria for task ${task.id}.`,
    '2. Implement only within the allowed files and folders.',
    '3. Avoid all forbidden files and areas.',
    '4. Run the required validation checks before finishing.',
    '',
    '## Validation',
    checkLines,
    '',
    '## Return format',
    task.outputFormat,
    '',
    'Do not commit.',
    'Do not push.',
  ].join('\n');
}

function buildPackageSummary(pkg: CursorExecutionPackage): string {
  return [
    `taskId=${pkg.taskId}`,
    `title=${pkg.title}`,
    `status=${pkg.status}`,
    `allowedPaths=${pkg.allowedPaths.join(', ')}`,
    `forbiddenPaths=${pkg.forbiddenPaths.length}`,
    `requiredChecks=${pkg.requiredChecks.length}`,
    `acceptanceCriteria=${pkg.acceptanceCriteria.length}`,
  ].join('; ');
}

/**
 * Prepares roadmap tasks for Cursor Agent execution without controlling Cursor directly.
 */
export class CursorTaskAdapter {
  private preparedCount = 0;
  private lastTaskId: string | null = null;
  private lastPrompt: string | null = null;
  private lastResult: CursorTaskExecutionResult | null = null;
  private entries: CursorTaskAdapterReport['entries'] = [];

  constructor(
    private readonly instanceId: string,
    private readonly defaults: {
      allowedPaths: string[];
      forbiddenPaths: string[];
      requiredChecks: string[];
      outputFormat: string;
    },
  ) {}

  validate(task: CursorTaskInput): void {
    this.assertTaskFields(task);
  }

  prompt(task: CursorTaskInput): string {
    this.validate(task);
    return buildPrompt(this.applyDefaults(task));
  }

  package(task: CursorTaskInput): CursorExecutionPackage {
    const normalized = this.applyDefaults(task);
    this.validate(normalized);
    const prompt = buildPrompt(normalized);

    return {
      taskId: normalized.id,
      title: normalized.title,
      prompt,
      allowedPaths: [...normalized.allowedPaths],
      forbiddenPaths: [...normalized.forbiddenPaths],
      requiredChecks: [...normalized.requiredChecks],
      outputFormat: normalized.outputFormat,
      acceptanceCriteria: [...normalized.acceptanceCriteria],
      status: 'prepared',
      preparedAt: nowIso(),
    };
  }

  prepare(task: CursorTaskInput): CursorTaskPrepareResult {
    const pkg = this.package(task);
    return {
      taskId: pkg.taskId,
      prompt: pkg.prompt,
      package: pkg,
    };
  }

  execute(task: CursorTaskInput): CursorTaskExecutionResult {
    const startMs = Date.now();
    const prepared = this.prepare(task);
    const durationMs = Date.now() - startMs;
    const summary = buildPackageSummary(prepared.package);

    const result: CursorTaskExecutionResult = {
      success: true,
      status: 'prepared',
      durationMs,
      prompt: prepared.prompt,
      package: prepared.package,
      summary,
    };

    this.preparedCount += 1;
    this.lastTaskId = task.id;
    this.lastPrompt = prepared.prompt;
    this.lastResult = result;
    this.entries.push({
      taskId: task.id,
      title: task.title,
      status: 'prepared',
      prompt: prepared.prompt,
      summary,
      preparedAt: prepared.package.preparedAt,
    });

    return result;
  }

  report(): CursorTaskAdapterReport {
    return {
      instanceId: this.instanceId,
      preparedCount: this.preparedCount,
      lastTaskId: this.lastTaskId,
      entries: [...this.entries],
    };
  }

  serialize(): SerializedCursorTaskAdapterSnapshot {
    return serializeCursorTaskAdapterSnapshot({
      snapshot: this.snapshot(),
      lastResult: this.lastResult,
      report: this.report(),
    });
  }

  reset(): void {
    this.preparedCount = 0;
    this.lastTaskId = null;
    this.lastPrompt = null;
    this.lastResult = null;
    this.entries = [];
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private snapshot(): CursorTaskAdapterSnapshot {
    return {
      instanceId: this.instanceId,
      preparedCount: this.preparedCount,
      lastTaskId: this.lastTaskId,
      lastPrompt: this.lastPrompt,
      updatedAt: nowIso(),
    };
  }

  private applyDefaults(task: CursorTaskInput): CursorTaskInput {
    return {
      ...task,
      allowedPaths:
        task.allowedPaths.length > 0 ? [...task.allowedPaths] : [...this.defaults.allowedPaths],
      forbiddenPaths:
        task.forbiddenPaths.length > 0
          ? [...task.forbiddenPaths]
          : [...this.defaults.forbiddenPaths],
      requiredChecks:
        task.requiredChecks.length > 0
          ? [...task.requiredChecks]
          : [...this.defaults.requiredChecks],
      outputFormat: isNonEmptyString(task.outputFormat)
        ? task.outputFormat.trim()
        : this.defaults.outputFormat,
      acceptanceCriteria: [...task.acceptanceCriteria],
      files: [...task.files],
      metadata: { ...task.metadata },
    };
  }

  private assertTaskFields(task: CursorTaskInput): void {
    if (!task || typeof task !== 'object') {
      throw new CursorTaskAdapterValidationError('task must be an object');
    }

    if (!isNonEmptyString(task.id)) {
      throw new CursorTaskAdapterValidationError('task id is required');
    }

    if (!isNonEmptyString(task.title)) {
      throw new CursorTaskAdapterValidationError('task title is required');
    }

    if (!isNonEmptyString(task.description)) {
      throw new CursorTaskAdapterValidationError('task description is required');
    }
  }
}

export function createCursorTaskAdapter(options?: CursorTaskAdapterOptions): CursorTaskAdapter {
  const instanceId = options?.instanceId?.trim() || 'default-cursor-task-adapter';

  return new CursorTaskAdapter(instanceId, {
    allowedPaths: options?.defaultAllowedPaths ?? [...DEFAULT_ALLOWED_PATHS],
    forbiddenPaths: options?.defaultForbiddenPaths ?? [...DEFAULT_FORBIDDEN_PATHS],
    requiredChecks: options?.defaultRequiredChecks ?? [...DEFAULT_REQUIRED_CHECKS],
    outputFormat: options?.defaultOutputFormat ?? DEFAULT_OUTPUT_FORMAT,
  });
}

export function createCursorTaskBackend(): import('@/services/automation/ai-task-executor-adapter-types').AITaskExecutorBackend {
  const cursorAdapter = createCursorTaskAdapter({ instanceId: 'cursor-task-backend' });

  return {
    name: 'cursor',
    version: '1.0.0',
    execute(task: AITaskExecutorTask) {
      const result = cursorAdapter.execute(fromAITaskExecutorTask(task));
      const report = `${result.prompt}\n\n---\n\nPackage summary: ${result.summary}`;

      return {
        success: true,
        status: 'prepared',
        filesChanged: [],
        warnings: [],
        errors: [],
        report,
        prompt: result.prompt,
        packageSummary: result.summary,
      };
    },
  };
}
