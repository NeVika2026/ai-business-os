export type FinalVideoExportScene = {
  id: string;
  title: string;
  durationSeconds: number;
  videoUrl: string;
  narration: string;
};

export type FinalVideoExportResult = {
  blob: Blob;
  mimeType: string;
  extension: 'mp4' | 'webm';
  durationSeconds: number;
};

type RenderStoryboardOptions = {
  scenes: FinalVideoExportScene[];
  voiceUrl?: string | null;
  musicUrl?: string | null;
  sfxUrl?: string | null;
  width?: number;
  height?: number;
  fps?: number;
};

function waitForVideo(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('error', handleError);
    };
    const handleLoaded = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error('Не удалось загрузить одну из сцен.'));
    };

    if (video.readyState >= 2) {
      resolve();
      return;
    }

    video.addEventListener('loadeddata', handleLoaded, { once: true });
    video.addEventListener('error', handleError, { once: true });
  });
}

function selectRecorderMimeType(): { mimeType: string; extension: 'mp4' | 'webm' } {
  const candidates = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' as const },
    { mimeType: 'video/mp4', extension: 'mp4' as const },
    { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' as const },
    { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' as const },
    { mimeType: 'video/webm', extension: 'webm' as const },
  ];

  const supported = candidates.find((item) => MediaRecorder.isTypeSupported(item.mimeType));
  if (supported) return supported;

  return { mimeType: '', extension: 'webm' };
}

function drawVideoCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
) {
  const sourceWidth = video.videoWidth || width;
  const sourceHeight = video.videoHeight || height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;

  ctx.drawImage(video, x, y, drawWidth, drawHeight);
}

function wrapCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? current + ' ' + word : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
) {
  const normalized = text.trim();
  if (!normalized) return;

  const fontSize = Math.max(34, Math.round(width * 0.048));
  const horizontalPadding = Math.round(width * 0.055);
  const lineHeight = Math.round(fontSize * 1.18);
  const maxTextWidth = width - horizontalPadding * 2 - 44;

  ctx.save();
  ctx.font = '800 ' + fontSize + 'px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = wrapCaption(ctx, normalized, maxTextWidth);
  const boxHeight = lines.length * lineHeight + 34;
  const boxWidth = Math.min(
    width - horizontalPadding * 2,
    Math.max(...lines.map((line) => ctx.measureText(line).width), 0) + 44,
  );
  const boxX = (width - boxWidth) / 2;
  const boxY = height - Math.round(height * 0.075) - boxHeight;

  ctx.fillStyle = 'rgba(0,0,0,.70)';
  const radius = 24;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  lines.forEach((line, index) => {
    const y = boxY + 17 + lineHeight / 2 + index * lineHeight;
    ctx.fillText(line, width / 2, y, maxTextWidth);
  });
  ctx.restore();
}

async function loadAudioBuffer(
  audioContext: AudioContext,
  url: string,
  label: string,
): Promise<AudioBuffer> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Не удалось загрузить ' + label + '.');
  const bytes = await response.arrayBuffer();
  return audioContext.decodeAudioData(bytes);
}

async function renderScene(
  ctx: CanvasRenderingContext2D,
  scene: FinalVideoExportScene,
  width: number,
  height: number,
) {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.preload = 'auto';
  video.playsInline = true;
  video.muted = true;
  video.src = scene.videoUrl;

  await waitForVideo(video);

  try {
    video.currentTime = 0;
  } catch {
    // Some remote videos do not allow seeking before playback.
  }

  await video.play();

  const durationMs = Math.max(250, scene.durationSeconds * 1000);
  const startedAt = performance.now();

  await new Promise<void>((resolve) => {
    const frame = (now: number) => {
      const elapsed = now - startedAt;

      ctx.fillStyle = '#05070b';
      ctx.fillRect(0, 0, width, height);

      if (video.readyState >= 2) {
        drawVideoCover(ctx, video, width, height);
      }

      drawCaption(ctx, scene.narration || scene.title, width, height);

      if (elapsed >= durationMs) {
        resolve();
        return;
      }

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  });

  video.pause();
  video.removeAttribute('src');
  video.load();
}

export async function renderStoryboardVideo(
  options: RenderStoryboardOptions,
): Promise<FinalVideoExportResult> {
  const scenes = options.scenes.filter((scene) => Boolean(scene.videoUrl));
  if (scenes.length === 0) {
    throw new Error('Нет готовых сцен для экспорта.');
  }

  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    throw new Error('Этот браузер не поддерживает локальный экспорт видео.');
  }

  const width = options.width ?? 768;
  const height = options.height ?? 1280;
  const fps = options.fps ?? 30;
  const totalDuration = scenes.reduce(
    (sum, scene) => sum + Math.max(0.1, scene.durationSeconds),
    0,
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) throw new Error('Не удалось создать видеохолст.');

  const videoStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream(videoStream.getVideoTracks());

  let audioContext: AudioContext | null = null;
  const audioSources: AudioBufferSourceNode[] = [];

  if (options.voiceUrl || options.musicUrl || options.sfxUrl) {
    audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    const addTrack = async (url: string, label: string, gainValue: number) => {
      if (!audioContext) return;
      const buffer = await loadAudioBuffer(audioContext, url, label);
      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      source.buffer = buffer;
      gain.gain.value = gainValue;
      source.connect(gain);
      gain.connect(destination);
      audioSources.push(source);
    };

    if (options.voiceUrl) await addTrack(options.voiceUrl, 'озвучку', 1);
    if (options.musicUrl) await addTrack(options.musicUrl, 'музыку', 0.22);
    if (options.sfxUrl) await addTrack(options.sfxUrl, 'звуковой эффект', 0.38);

    for (const track of destination.stream.getAudioTracks()) {
      combinedStream.addTrack(track);
    }
  }

  const { mimeType, extension } = selectRecorderMimeType();
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(
    combinedStream,
    mimeType
      ? {
          mimeType,
          videoBitsPerSecond: 6_000_000,
          audioBitsPerSecond: 192_000,
        }
      : undefined,
  );

  const stopped = new Promise<void>((resolve, reject) => {
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    recorder.addEventListener('stop', () => resolve(), { once: true });
    recorder.addEventListener('error', () => reject(new Error('Ошибка кодирования видео.')), {
      once: true,
    });
  });

  recorder.start(1000);
  for (const source of audioSources) source.start(0);

  try {
    for (const scene of scenes) {
      await renderScene(ctx, scene, width, height);
    }
  } finally {
    if (recorder.state !== 'inactive') recorder.stop();
  }

  await stopped;

  for (const source of audioSources) {
    try {
      source.stop();
    } catch {
      // Track may already have ended naturally.
    }
  }
  for (const track of combinedStream.getTracks()) track.stop();
  await audioContext?.close();

  const outputMimeType = recorder.mimeType || mimeType || 'video/webm';
  const blob = new Blob(chunks, { type: outputMimeType });

  if (blob.size === 0) {
    throw new Error('Браузер не смог собрать финальный видеофайл.');
  }

  return {
    blob,
    mimeType: outputMimeType,
    extension: outputMimeType.includes('mp4') ? 'mp4' : extension,
    durationSeconds: totalDuration,
  };
}
