export const OSA_DEMO_MODE_KEY = 'osa_demo_mode';
export const OSA_DEMO_PROJECT_ID_KEY = 'osa_demo_project_id';
export const OSA_DEMO_SESSION_KEY = 'osa_demo_session_active';
export const OSA_DEMO_FIRST_CONTACT_PENDING_KEY = 'osa_demo_first_contact_pending';

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable.
  }
}

function removeStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage may be unavailable.
  }
}

export function isDemoModeEnabled(): boolean {
  return readStorage(OSA_DEMO_MODE_KEY) === '1';
}

export function setDemoModeEnabled(enabled: boolean): void {
  if (enabled) {
    writeStorage(OSA_DEMO_MODE_KEY, '1');
    return;
  }

  removeStorage(OSA_DEMO_MODE_KEY);
  removeStorage(OSA_DEMO_PROJECT_ID_KEY);
  removeStorage(OSA_DEMO_SESSION_KEY);
  removeStorage(OSA_DEMO_FIRST_CONTACT_PENDING_KEY);
}

export function getDemoProjectId(): string | null {
  return readStorage(OSA_DEMO_PROJECT_ID_KEY);
}

export function setDemoProjectId(projectId: string): void {
  writeStorage(OSA_DEMO_PROJECT_ID_KEY, projectId);
}

export function isDemoSessionActive(): boolean {
  return readStorage(OSA_DEMO_SESSION_KEY) === '1';
}

export function startDemoSession(projectId: string): void {
  writeStorage(OSA_DEMO_SESSION_KEY, '1');
  writeStorage(OSA_DEMO_PROJECT_ID_KEY, projectId);
  writeStorage(OSA_DEMO_FIRST_CONTACT_PENDING_KEY, '1');
}

export function clearDemoSession(): void {
  removeStorage(OSA_DEMO_SESSION_KEY);
  removeStorage(OSA_DEMO_FIRST_CONTACT_PENDING_KEY);
}

export function isDemoFirstContactPending(): boolean {
  return readStorage(OSA_DEMO_FIRST_CONTACT_PENDING_KEY) === '1';
}

export function markDemoFirstContactComplete(): void {
  removeStorage(OSA_DEMO_FIRST_CONTACT_PENDING_KEY);
}

export function isActiveDemoProject(projectId: string): boolean {
  return isDemoSessionActive() && getDemoProjectId() === projectId;
}
