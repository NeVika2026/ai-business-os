const RUNWAY_API_BASE = 'https://api.dev.runwayml.com';
const RUNWAY_API_VERSION = '2024-11-06';

export type RunwayGenerationKind = 'video' | 'image';

export type RunwayTaskView = {
  id: string;
  status: string;
  output: string[];
  failureCode: string | null;
  failure: string | null;
};

export type CreateRunwayGenerationInput = {
  kind: RunwayGenerationKind;
  promptText: string;
  portrait?: boolean;
  duration?: number;
};

function requireRunwaySecret(): string {
  const secret = process.env.RUNWAYML_API_SECRET?.trim();

  if (!secret) {
    throw new Error('Видео-движок не подключён');
  }

  return secret;
}

function normalizePrompt(promptText: string): string {
  const prompt = promptText.trim();

  if (!prompt) {
    throw new Error('Описание результата обязательно');
  }

  return prompt.slice(0, 3500);
}

function normalizeDuration(value?: number): number {
  const duration = Number.isFinite(value) ? Number(value) : 5;
  return Math.min(10, Math.max(2, Math.round(duration)));
}

async function runwayRequest(path: string, init?: RequestInit): Promise<Response> {
  const secret = requireRunwaySecret();

  return fetch(RUNWAY_API_BASE + path, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: 'Bearer ' + secret,
      'X-Runway-Version': RUNWAY_API_VERSION,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(30_000),
  });
}

async function readProviderError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: string | { message?: string };
      message?: string;
    };

    if (typeof payload.error === 'string') return payload.error;
    if (payload.error && typeof payload.error === 'object' && payload.error.message) {
      return payload.error.message;
    }
    if (payload.message) return payload.message;
  } catch {
    // Ignore malformed provider error payload.
  }

  return 'Runway request failed with status ' + response.status;
}

export function hasRunwayMediaProvider(): boolean {
  return Boolean(process.env.RUNWAYML_API_SECRET?.trim());
}

export async function createRunwayGeneration(
  input: CreateRunwayGenerationInput,
): Promise<{ id: string; kind: RunwayGenerationKind }> {
  const promptText = normalizePrompt(input.promptText);
  const portrait = input.portrait ?? true;

  const request =
    input.kind === 'video'
      ? {
          path: '/v1/image_to_video',
          body: {
            model: 'gen4.5',
            promptText,
            ratio: portrait ? '720:1280' : '1280:720',
            duration: normalizeDuration(input.duration),
          },
        }
      : {
          path: '/v1/text_to_image',
          body: {
            model: 'gen4_image',
            promptText,
            ratio: portrait ? '1080:1920' : '1920:1080',
          },
        };

  const response = await runwayRequest(request.path, {
    method: 'POST',
    body: JSON.stringify(request.body),
  });

  if (!response.ok) {
    throw new Error(await readProviderError(response));
  }

  const payload = (await response.json()) as { id?: string };

  if (!payload.id) {
    throw new Error('Runway did not return a task id');
  }

  return { id: payload.id, kind: input.kind };
}

export async function getRunwayTask(taskId: string): Promise<RunwayTaskView> {
  const id = taskId.trim();

  if (!id) {
    throw new Error('taskId is required');
  }

  const response = await runwayRequest('/v1/tasks/' + encodeURIComponent(id), {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(await readProviderError(response));
  }

  const payload = (await response.json()) as {
    id?: string;
    status?: string;
    output?: unknown[];
    failureCode?: string;
    failure?: string;
  };

  return {
    id: payload.id ?? id,
    status: payload.status ?? 'UNKNOWN',
    output: Array.isArray(payload.output)
      ? payload.output.filter((item): item is string => typeof item === 'string')
      : [],
    failureCode: payload.failureCode ?? null,
    failure: payload.failure ?? null,
  };
}

export async function proxyRunwayOutput(taskId: string): Promise<Response> {
  const task = await getRunwayTask(taskId);

  if (task.status !== 'SUCCEEDED' || task.output.length === 0) {
    throw new Error('Файл ещё не готов');
  }

  const source = await fetch(task.output[0]!, {
    cache: 'no-store',
    signal: AbortSignal.timeout(60_000),
  });

  if (!source.ok) {
    throw new Error('Не удалось получить готовый файл');
  }

  return source;
}
