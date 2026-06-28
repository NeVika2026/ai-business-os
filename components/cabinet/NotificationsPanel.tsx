export function NotificationsPanel() {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notifications</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">System alerts and updates</p>
      </header>

      <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-8 text-center">
        <p className="text-sm font-medium text-[var(--text-primary)]">No notifications</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Alerts from OSA, modules, and platform services will appear here.
        </p>
      </div>
    </section>
  );
}
