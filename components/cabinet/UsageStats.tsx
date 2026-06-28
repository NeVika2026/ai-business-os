import { CABINET_LAYOUT } from '@/utils/cabinet/cabinet-config';

const USAGE_PLACEHOLDERS = [
  { id: 'usage_statistics', label: 'Usage statistics' },
  { id: 'ai_credits', label: 'AI credits' },
  { id: 'tokens', label: 'Tokens used' },
  { id: 'runtime_calls', label: 'Runtime calls' },
] as const;

export function UsageStats() {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Usage</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Platform usage metrics — placeholders until billing is connected
        </p>
      </header>

      <div className={CABINET_LAYOUT.statsGrid}>
        {USAGE_PLACEHOLDERS.map((item) => (
          <div key={item.id} className="rounded-xl bg-[var(--surface-0)] px-3 py-4 sm:px-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">—</p>
          </div>
        ))}
      </div>
    </section>
  );
}
