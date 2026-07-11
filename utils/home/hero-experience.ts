export const HERO_GREETINGS = ['Чем сегодня помочь?', 'С чего начнём?'] as const;

export const HERO_HOME_GREETING = 'Чем сегодня помочь?' as const;

export const HERO_HOME_PLACEHOLDER =
  'Расскажите, что хотите создать, улучшить или решить…' as const;

export type HeroPhase = 'orbit-free' | 'orbit-gather' | 'eyes-form' | 'eyes-alive' | 'ready';

export const HERO_PHASE_MS: Record<Exclude<HeroPhase, 'ready'>, number> = {
  'orbit-free': 1_000,
  'orbit-gather': 2_000,
  'eyes-form': 2_500,
  'eyes-alive': 3_500,
};

export const HERO_SKIP_TRANSITION_MS = 420;

export const HERO_ORBIT_COUNT = 3;

export function pickHeroGreeting(referenceDate = new Date()): (typeof HERO_GREETINGS)[number] {
  return HERO_GREETINGS[referenceDate.getDate() % HERO_GREETINGS.length]!;
}

export function nextHeroPhase(phase: HeroPhase): HeroPhase {
  switch (phase) {
    case 'orbit-free':
      return 'orbit-gather';
    case 'orbit-gather':
      return 'eyes-form';
    case 'eyes-form':
      return 'eyes-alive';
    case 'eyes-alive':
      return 'ready';
    case 'ready':
      return 'ready';
  }
}

export function heroPhaseDelay(phase: HeroPhase): number | null {
  if (phase === 'ready') {
    return null;
  }

  const order: Exclude<HeroPhase, 'ready'>[] = [
    'orbit-free',
    'orbit-gather',
    'eyes-form',
    'eyes-alive',
  ];
  const index = order.indexOf(phase);
  const previousMs = index === 0 ? 0 : HERO_PHASE_MS[order[index - 1]!];

  return HERO_PHASE_MS[phase] - previousMs;
}

export function heroLightIntensity(phase: HeroPhase, typing: boolean): number {
  if (typing) {
    return 1;
  }

  switch (phase) {
    case 'orbit-free':
      return 0.35;
    case 'orbit-gather':
      return 0.55;
    case 'eyes-form':
      return 0.78;
    case 'eyes-alive':
      return 0.92;
    case 'ready':
      return 0.85;
  }
}

export function heroLightWarmth(phase: HeroPhase, typing: boolean): number {
  if (typing) {
    return 1;
  }

  switch (phase) {
    case 'orbit-free':
    case 'orbit-gather':
      return 0.2;
    case 'eyes-form':
      return 0.45;
    case 'eyes-alive':
    case 'ready':
      return 0.65;
  }
}
