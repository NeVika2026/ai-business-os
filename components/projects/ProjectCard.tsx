import Link from 'next/link';

import { getProjectStatusLabel } from '@/utils/projects/project-mappers';
import type { ProjectListItem, ProjectStatus } from '@/utils/projects/project-types';

type ProjectCardProps = {
  project: ProjectListItem;
};

function formatLastActivity(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getProgressPercent(status: ProjectStatus, executionCount: number): number {
  if (status === 'completed' || status === 'archived') {
    return 100;
  }

  if (status === 'planning') {
    return 22;
  }

  if (status === 'paused') {
    return 38;
  }

  if (status === 'active') {
    return Math.min(42 + executionCount * 12, 88);
  }

  return 30;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const progress = getProgressPercent(project.status, project.executionCount);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex min-h-[220px] flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 transition hover:border-[var(--accent)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Workspace
          </p>
          <h3 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            {project.name}
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          Last activity · {formatLastActivity(project.updatedAt)}
        </p>

        {project.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {project.description}
          </p>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            <span>{getProjectStatusLabel(project.status)}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-0)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <span className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
        Open workspace
      </span>
    </Link>
  );
}
