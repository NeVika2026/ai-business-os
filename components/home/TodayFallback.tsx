import Link from 'next/link';

export function TodayFallback() {
  return (
    <section className="mx-auto w-full max-w-xl space-y-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">Today</p>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
          Today is temporarily unavailable.
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          You can still continue your work from Projects or History.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/projects"
          className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Projects
        </Link>
        <Link
          href="/history"
          className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
        >
          History
        </Link>
      </div>
    </section>
  );
}
