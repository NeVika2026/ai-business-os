import {
  CABINET_LAYOUT,
  SYSTEM_HEALTH_ITEMS,
  SYSTEM_HEALTH_LABELS,
  SYSTEM_HEALTH_STYLES,
} from '@/utils/cabinet/cabinet-config';

export function SystemHealth() {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">System Health</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Core platform services — status placeholders
        </p>
      </header>

      <div className={CABINET_LAYOUT.healthGrid}>
        {SYSTEM_HEALTH_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border px-3 py-3 text-center ${SYSTEM_HEALTH_STYLES[item.status]}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide">{item.label}</p>
            <p className="mt-1 text-sm font-semibold">{SYSTEM_HEALTH_LABELS[item.status]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
