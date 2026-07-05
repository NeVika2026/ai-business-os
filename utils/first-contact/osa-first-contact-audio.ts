import { OSA_SONIC_LOGO_AUDIO } from './osa-first-contact';

const activeAudios = new Set<HTMLAudioElement>();

function playGeneratedDeepSonicLogo(volume: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    const ctx = new AudioContextCtor();
    const start = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(52, start);

    const peak = Math.min(0.12, 0.09 * volume);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.35);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(start);
    oscillator.stop(start + 1.4);

    window.setTimeout(() => {
      void ctx.close();
    }, 1_600);
  } catch {
    // First contact works without audio.
  }
}

async function playAudioFile(path: string, volume: number): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.preload = 'auto';
    activeAudios.add(audio);

    const release = () => {
      activeAudios.delete(audio);
    };

    audio.addEventListener('ended', release, { once: true });
    audio.addEventListener('error', release, { once: true });

    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export async function playOsaSonicLogo(volume = 1): Promise<void> {
  const played = await playAudioFile(OSA_SONIC_LOGO_AUDIO, volume);

  if (!played) {
    playGeneratedDeepSonicLogo(volume);
  }
}

export function stopOsaFirstContactAudio(): void {
  if (typeof window === 'undefined') {
    return;
  }

  for (const audio of activeAudios) {
    audio.pause();
    audio.currentTime = 0;
  }

  activeAudios.clear();
}
