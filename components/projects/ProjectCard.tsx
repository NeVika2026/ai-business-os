import Link from 'next/link';

import { getProjectStatusLabel, getProjectTypeLabel } from '@/utils/projects/project-mappers';
import type { ProjectListItem } from '@/utils/projects/project-types';

type ProjectCardProps = {
  project: ProjectListItem;
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ProjectCard({ project }: ProjectCardProps) {
  const icon = project.icon ?? '📁';

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 transition hover:border-[var(--accent)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      style={project.color ? { borderColor: `${project.color}55` } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="text-2xl">
            {icon}
          </span>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{project.name}</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {getProjectTypeLabel(project.type)} · {getProjectStatusLabel(project.status)}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          {project.moduleCount} modules
        </span>
      </div>

      {project.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-[var(--text-secondary)]">
          {project.description}
        </p>
      ) : (
        <p className="mt-3 text-sm text-[var(--text-secondary)]">No description yet.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
        <span className="rounded-full bg-[var(--surface-0)] px-2 py-1">
          {project.executionCount} executions
        </span>
        <span className="rounded-full bg-[var(--surface-0)] px-2 py-1">
          {project.documentCount} documents
        </span>
        <span className="rounded-full bg-[var(--surface-0)] px-2 py-1">
          Updated {formatUpdatedAt(project.updatedAt)}
        </span>
      </div>
    </Link>
  );
}
