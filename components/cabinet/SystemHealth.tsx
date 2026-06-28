import {
  HEALTH_STATUS_LABELS,
  HEALTH_STATUS_STYLES,
  type HealthDisplayStatus,
} from '@/utils/cabinet/dashboard-mappers';
import { CABINET_LAYOUT } from '@/utils/cabinet/cabinet-config';

type SystemHealthProps = {
  items: Array<{ id: string; label: string; status: HealthDisplayStatus }>;
};

export function SystemHealth({ items }: SystemHealthProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">System Health</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Live platform service status</p>
      </header>

      <div className={CABINET_LAYOUT.healthGrid}>
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border px-3 py-3 text-center ${HEALTH_STATUS_STYLES[item.status]}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide">{item.label}</p>
            <p className="mt-1 text-sm font-semibold">{HEALTH_STATUS_LABELS[item.status]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
