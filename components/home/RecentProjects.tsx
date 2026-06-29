import Link from 'next/link';

import type { HomeProjectItem } from '@/utils/home/home-types';

type RecentProjectsProps = {
  projects: HomeProjectItem[];
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent projects</h2>
        <Link href="/projects" className="text-sm text-[var(--accent)] hover:underline">
          View all
        </Link>
      </header>

      {projects.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">Create a project to get started.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={project.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 hover:border-[var(--accent)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{project.name}</p>
                  <p className="text-xs capitalize text-[var(--text-secondary)]">{project.type}</p>
                </div>
                <time className="text-xs text-[var(--text-secondary)]">
                  {formatUpdatedAt(project.updatedAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
