import { deliverablePhaseLabel } from '@/lib/deliverables/deliverable-catalog';
import type { ProjectDeliverablesPackage } from '@/types/deliverables';

type ProjectDeliverablesProgressProps = {
  deliverables: ProjectDeliverablesPackage;
};

function phaseTone(phase: ProjectDeliverablesPackage['deliverables'][number]['phase']): string {
  switch (phase) {
    case 'thinking':
      return 'text-[var(--text-tertiary)]';
    case 'draft':
      return 'text-[var(--accent)]';
    case 'ready':
      return 'text-[var(--text-secondary)]';
  }
}

export function ProjectDeliverablesProgress({ deliverables }: ProjectDeliverablesProgressProps) {
  if (deliverables.deliverables.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        Deliverables
      </p>
      <ul className="mt-5 space-y-4">
        {deliverables.deliverables.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-6">
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-[var(--text-primary)]">{item.title}</p>
              <p className="mt-1 truncate text-[13px] text-[var(--text-tertiary)]">{item.agentRole}</p>
            </div>
            <p className={`shrink-0 text-[13px] font-medium ${phaseTone(item.phase)}`}>
              {deliverablePhaseLabel(item.phase)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
