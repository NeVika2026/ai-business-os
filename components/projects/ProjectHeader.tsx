import Link from 'next/link';

import { getProjectStatusLabel, getProjectTypeLabel } from '@/utils/projects/project-mappers';
import type { Project } from '@/utils/projects/project-types';

type ProjectHeaderProps = {
  project: Project;
};

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const icon = project.icon ?? '📁';

  return (
    <header className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="text-4xl">
            {icon}
          </span>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/projects"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
              >
                Projects
              </Link>
              <span className="text-sm text-[var(--text-secondary)]">/</span>
              <span className="text-sm text-[var(--text-secondary)]">{project.slug}</span>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
              {project.name}
            </h1>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-1 font-medium text-[var(--text-primary)]">
                {getProjectTypeLabel(project.type)}
              </span>
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-1 font-medium text-[var(--text-primary)]">
                {getProjectStatusLabel(project.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/osa?project=${project.id}`}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Run OSA
          </Link>
          <Link
            href={`/knowledge?project=${project.id}`}
            className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm"
          >
            Open knowledge
          </Link>
        </div>
      </div>
    </header>
  );
}
