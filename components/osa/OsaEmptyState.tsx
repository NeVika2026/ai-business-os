import { OrbitMark } from '@/components/brand/OrbitMark';

type OsaEmptyStateProps = {
  title: string;
  description: string;
  hint: string;
  compact?: boolean;
};

export function OsaEmptyState({ title, description, hint, compact = false }: OsaEmptyStateProps) {
  return (
    <div
      className={`osa-empty-state flex flex-col items-center text-center ${compact ? 'py-10' : 'py-16'}`}
      role="status"
    >
      <div className="osa-orbit-presence">
        <OrbitMark size={compact ? 'sm' : 'md'} breathe className="text-[var(--accent)] opacity-70" />
      </div>
      <h2 className="mt-6 text-[17px] font-medium text-[var(--text-primary)]">{title}</h2>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--text-secondary)]">{description}</p>
      <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-[var(--text-tertiary)]">{hint}</p>
    </div>
  );
}
