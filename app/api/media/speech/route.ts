import { NextResponse } from 'next/server';

import { createSpeechWithTiming } from '@/services/media/elevenlabs-client';
import { hasAuthenticatedMediaUser } from '@/services/media/media-auth';
import { buildSrtFromAlignment } from '@/utils/media/subtitles';

export const runtime = 'nodejs';
export const maxDuration = 60;

type SpeechRequestBody = {
  text?: unknown;
  voiceId?: unknown;
  approved?: unknown;
};

export async function POST(request: Request) {
  if (!(await hasAuthenticatedMediaUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SpeechRequestBody;

  try {
    body = (await request.json()) as SpeechRequestBody;
  } catch {
    return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 });
  }

  if (body.approved !== true) {
    return NextResponse.json(
      { error: 'Платная генерация требует явного подтверждения' },
      { status: 409 },
    );
  }

  const text = typeof body.text === 'string' ? body.text : '';
  const voiceId = typeof body.voiceId === 'string' ? body.voiceId : undefined;

  try {
    const result = await createSpeechWithTiming({ text, voiceId });
    const alignment = result.normalizedAlignment ?? result.alignment;

    return NextResponse.json(
      {
        audioBase64: result.audioBase64,
        mimeType: result.mimeType,
        voiceId: result.voiceId,
        srt: buildSrtFromAlignment(alignment),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось создать озвучку';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
