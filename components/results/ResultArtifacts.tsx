import type { ResultArtifact, ResultArtifactKind } from '@/utils/results/result-mappers';

const KIND_LABELS: Record<ResultArtifactKind, string> = {
  document: 'Document',
  strategy: 'Strategy',
  content: 'Content',
  report: 'Report',
  plan: 'Plan',
  file: 'File',
  output: 'Deliverable',
};

type ResultArtifactsProps = {
  artifacts: ResultArtifact[];
};

export function ResultArtifacts({ artifacts }: ResultArtifactsProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Artifacts</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Documents, strategies, content, reports, plans, and files from this result
        </p>
      </div>

      {artifacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
          No artifacts yet.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {artifacts.map((artifact) => (
            <li
              key={artifact.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">{artifact.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {artifact.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--surface-0)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                  {KIND_LABELS[artifact.kind]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
