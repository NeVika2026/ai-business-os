/**
 * Short OSA Sonic Logo — synthesized via Web Audio API.
 * No external files. Fails silently when audio is unavailable.
 */
export function playThinkingSceneSound(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.06, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const start = ctx.currentTime;
    playTone(392, start, 0.35);
    playTone(523.25, start + 0.12, 0.45);
    playTone(659.25, start + 0.28, 0.55);

    window.setTimeout(() => {
      void ctx.close();
    }, 1_200);
  } catch {
    // Scene works without sound.
  }
}
