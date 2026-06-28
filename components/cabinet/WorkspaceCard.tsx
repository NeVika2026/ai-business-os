import Link from 'next/link';

export function WorkspaceCard() {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
            Workspace
          </p>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Active workspace</h2>
        </div>
        <Link
          href="/workspace"
          className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Open
        </Link>
      </header>

      <div className="space-y-3 rounded-xl bg-[var(--surface-0)] p-4">
        <p className="text-sm font-medium text-[var(--text-primary)]">Default workspace</p>
        <p className="text-sm text-[var(--text-secondary)]">
          Workspace context will appear here once connected.
        </p>
        <dl className="grid grid-cols-2 gap-3 pt-2 text-sm">
          <div>
            <dt className="text-[var(--text-secondary)]">Status</dt>
            <dd className="font-medium text-[var(--text-primary)]">—</dd>
          </div>
          <div>
            <dt className="text-[var(--text-secondary)]">Last active</dt>
            <dd className="font-medium text-[var(--text-primary)]">—</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
