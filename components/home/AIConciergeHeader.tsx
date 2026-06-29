import type { ConciergeGreeting } from '@/utils/home/concierge-mappers';

type AIConciergeHeaderProps = {
  greeting: ConciergeGreeting;
};

export function AIConciergeHeader({ greeting }: AIConciergeHeaderProps) {
  return (
    <header className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
        AI Concierge
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
        {greeting.salutation}, {greeting.userName}
      </h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{greeting.organization}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Current focus" value={greeting.currentFocus} />
        <Metric label="Current project" value={greeting.currentProject ?? 'None yet'} />
        <Metric label="Current execution" value={greeting.currentExecution ?? 'None running'} />
      </div>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
