'use client';

import { OrbitMark } from '@/components/brand/OrbitMark';

type OsaOrbitLoadingProps = {
  message: string;
  compact?: boolean;
};

export function OsaOrbitLoading({ message, compact = false }: OsaOrbitLoadingProps) {
  return (
    <div
      className={`osa-orbit-loading flex flex-col items-center justify-center text-center ${
        compact ? 'py-8' : 'py-16'
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="osa-orbit-presence">
        <OrbitMark size={compact ? 'md' : 'lg'} breathe className="text-[var(--accent)]" />
      </div>
      <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[var(--text-secondary)]">{message}</p>
    </div>
  );
}
