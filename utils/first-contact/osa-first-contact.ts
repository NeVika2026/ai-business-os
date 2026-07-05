export const OSA_FIRST_CONTACT_SEEN_KEY = 'osa_first_contact_seen';

/** 00:00–00:02 */
export const OSA_FIRST_CONTACT_OPENING_SILENCE_MS = 2_000;

/** 00:02–00:03: silence after sonic logo */
export const OSA_FIRST_CONTACT_POST_SONIC_MS = 1_000;

export const OSA_FIRST_CONTACT_LINE_ENTER_MS = 650;

export const OSA_FIRST_CONTACT_LINE_HOLD_MS = 1_200;

export const OSA_FIRST_CONTACT_LINE_DISSOLVE_MS = 450;

export const OSA_FIRST_CONTACT_LINE_GAP_MS = 700;

/** 00:08–00:09: orbit emerges from darkness */
export const OSA_FIRST_CONTACT_ORBIT_BIRTH_MS = 1_000;

export const OSA_FIRST_CONTACT_ORBIT_LINE_ENTER_MS = 550;

export const OSA_FIRST_CONTACT_ORBIT_LINE_HOLD_MS = 900;

export const OSA_FIRST_CONTACT_ORBIT_LINE_DISSOLVE_MS = 350;

/** 00:13: silence before OSA */
export const OSA_FIRST_CONTACT_CLOSING_SILENCE_MS = 200;

export const OSA_FIRST_CONTACT_OSA_WORD_ENTER_MS = 550;

export const OSA_FIRST_CONTACT_TAGLINE_ENTER_MS = 350;

export const OSA_FIRST_CONTACT_CLOSING_HOLD_MS = 350;

/** 00:15: dissolve to login */
export const OSA_FIRST_CONTACT_FINAL_DISSOLVE_MS = 550;

export const OSA_SONIC_LOGO_AUDIO = '/assets/audio/sonic-logo.mp3';

export const OSA_FIRST_CONTACT_OPENING_LINES = [
  'Ты снова открыл новый сервис.',
  'Надеясь, что именно он всё изменит.',
] as const;

export const OSA_FIRST_CONTACT_ORBIT_LINES = [
  'Но проблема никогда не была в сервисах.',
  'Тебе не хватало системы.',
] as const;

export const OSA_FIRST_CONTACT_CLOSING_TAGLINE = 'Теперь мы работаем вместе.';

export function prefersReducedMotionFirstContact(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function hasSeenOsaFirstContact(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(OSA_FIRST_CONTACT_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOsaFirstContactSeen(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(OSA_FIRST_CONTACT_SEEN_KEY, '1');
  } catch {
    // Storage may be unavailable in private mode.
  }
}
