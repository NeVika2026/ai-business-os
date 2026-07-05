'use client';

import { useSyncExternalStore, useState } from 'react';

import {
  isDemoModeEnabled,
  setDemoModeEnabled,
} from '@/utils/demo/osa-demo-mode';

function subscribeToClientMount() {
  return () => {};
}

export function DemoModeToggle() {
  const mounted = useSyncExternalStore(subscribeToClientMount, () => true, () => false);
  const [enabled, setEnabled] = useState(() => isDemoModeEnabled());

  if (!mounted) {
    return null;
  }

  return (
    <label className="flex items-start justify-between gap-6 py-4">
      <div>
        <p className="text-[15px] font-medium text-[var(--text-primary)]">Demo Mode</p>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-secondary)]">
          Investor Demo за 90 секунд. Автоматически создаёт демонстрационный проект и не затрагивает
          остальные проекты.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => {
          const next = !enabled;
          setEnabled(next);
          setDemoModeEnabled(next);
        }}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled ? 'bg-[var(--accent)]' : 'bg-[var(--border-subtle)]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
            enabled ? 'left-[1.375rem]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}
