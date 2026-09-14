export type ElevenAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export type ElevenSpeechResult = {
  audioBase64: string;
  alignment: ElevenAlignment | null;
  normalizedAlignment: ElevenAlignment | null;
  voiceId: string;
  mimeType: 'audio/mpeg';
};

type ElevenVoice = {
  voice_id?: string;
  name?: string;
  verified_languages?: Array<{
    language?: string;
    locale?: string;
  }>;
};

function requireElevenLabsKey(): string {
  const key = process.env.ELEVENLABS_API_KEY?.trim();

  if (!key) {
    throw new Error('Движок озвучки не подключён');
  }

  return key;
}

async function elevenRequest(path: string, init?: RequestInit): Promise<Response> {
  const key = requireElevenLabsKey();

  return fetch('https://api.elevenlabs.io' + path, {
    ...init,
    cache: 'no-store',
    headers: {
      'xi-api-key': key,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(45_000),
  });
}

async function readProviderError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      detail?: string | { message?: string };
      message?: string;
    };

    if (typeof payload.detail === 'string') return payload.detail;
    if (payload.detail && typeof payload.detail === 'object' && payload.detail.message) {
      return payload.detail.message;
    }
    if (payload.message) return payload.message;
  } catch {
    // Ignore malformed provider error payload.
  }

  return 'ElevenLabs request failed with status ' + response.status;
}

function isRussianVoice(voice: ElevenVoice): boolean {
  return (voice.verified_languages ?? []).some((item) => {
    const language = item.language?.toLowerCase() ?? '';
    const locale = item.locale?.toLowerCase() ?? '';
    return language === 'ru' || locale.startsWith('ru');
  });
}

async function resolveVoiceId(preferredVoiceId?: string): Promise<string> {
  const configured = preferredVoiceId?.trim() || process.env.ELEVENLABS_VOICE_ID?.trim();

  if (configured) {
    return configured;
  }

  const response = await elevenRequest(
    '/v2/voices?page_size=20&voice_type=default&include_total_count=false',
    { method: 'GET' },
  );

  if (!response.ok) {
    throw new Error(await readProviderError(response));
  }

  const payload = (await response.json()) as { voices?: ElevenVoice[] };
  const voices = payload.voices ?? [];
  const voice = voices.find(isRussianVoice) ?? voices[0];

  if (!voice?.voice_id) {
    throw new Error('Не найден доступный голос');
  }

  return voice.voice_id;
}

function toAlignment(value: unknown): ElevenAlignment | null {
  if (!value || typeof value !== 'object') return null;

  const source = value as Partial<ElevenAlignment>;
  if (
    !Array.isArray(source.characters) ||
    !Array.isArray(source.character_start_times_seconds) ||
    !Array.isArray(source.character_end_times_seconds)
  ) {
    return null;
  }

  return {
    characters: source.characters.filter((item): item is string => typeof item === 'string'),
    character_start_times_seconds: source.character_start_times_seconds.filter(
      (item): item is number => typeof item === 'number',
    ),
    character_end_times_seconds: source.character_end_times_seconds.filter(
      (item): item is number => typeof item === 'number',
    ),
  };
}

export function hasElevenLabsProvider(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

export async function createSpeechWithTiming(input: {
  text: string;
  voiceId?: string;
}): Promise<ElevenSpeechResult> {
  const text = input.text.trim();

  if (!text) {
    throw new Error('Текст озвучки обязателен');
  }

  if (text.length > 5000) {
    throw new Error('Для одной озвучки используйте не более 5000 символов');
  }

  const voiceId = await resolveVoiceId(input.voiceId);
  const response = await elevenRequest(
    '/v1/text-to-speech/' + encodeURIComponent(voiceId) + '/with-timestamps?output_format=mp3_44100_128',
    {
      method: 'POST',
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await readProviderError(response));
  }

  const payload = (await response.json()) as {
    audio_base64?: string;
    alignment?: unknown;
    normalized_alignment?: unknown;
  };

  if (!payload.audio_base64) {
    throw new Error('Движок озвучки не вернул аудиофайл');
  }

  return {
    audioBase64: payload.audio_base64,
    alignment: toAlignment(payload.alignment),
    normalizedAlignment: toAlignment(payload.normalized_alignment),
    voiceId,
    mimeType: 'audio/mpeg',
  };
}
