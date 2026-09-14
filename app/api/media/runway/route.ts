import { NextResponse } from 'next/server';

import { hasAuthenticatedMediaUser } from '@/services/media/media-auth';
import {
  createRunwayGeneration,
  type RunwayGenerationKind,
} from '@/services/media/runway-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

type GenerationRequestBody = {
  kind?: unknown;
  promptText?: unknown;
  format?: unknown;
  duration?: unknown;
  approved?: unknown;
};

function readKind(value: unknown): RunwayGenerationKind | null {
  return value === 'video' || value === 'image' ? value : null;
}

function isPortrait(format: string): boolean {
  const value = format.toLowerCase();
  return (
    value.includes('9:16') ||
    value.includes('portrait') ||
    value.includes('vertical') ||
    value.includes('вертик')
  );
}

export async function POST(request: Request) {
  if (!(await hasAuthenticatedMediaUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: GenerationRequestBody;

  try {
    body = (await request.json()) as GenerationRequestBody;
  } catch {
    return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 });
  }

  if (body.approved !== true) {
    return NextResponse.json(
      { error: 'Платная генерация требует явного подтверждения' },
      { status: 409 },
    );
  }

  const kind = readKind(body.kind);
  const promptText = typeof body.promptText === 'string' ? body.promptText : '';
  const format = typeof body.format === 'string' ? body.format : '';
  const duration = typeof body.duration === 'number' ? body.duration : undefined;

  if (!kind) {
    return NextResponse.json({ error: 'kind должен быть video или image' }, { status: 400 });
  }

  try {
    const task = await createRunwayGeneration({
      kind,
      promptText,
      portrait: isPortrait(format) || !format.trim(),
      duration,
    });

    return NextResponse.json(
      {
        id: task.id,
        kind: task.kind,
        status: 'PENDING',
      },
      { status: 202, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось запустить генерацию';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
