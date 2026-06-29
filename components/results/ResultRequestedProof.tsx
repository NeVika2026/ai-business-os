type ResultRequestedProofProps = {
  requested: string;
};

export function ResultRequestedProof({ requested }: ResultRequestedProofProps) {
  return (
    <details className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-5 py-4">
      <summary className="cursor-pointer text-sm font-medium text-[var(--text-secondary)]">
        What you asked for
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-primary)]">{requested}</p>
    </details>
  );
}
