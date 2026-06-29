'use client';

import { useState } from 'react';

import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { ProjectCard } from '@/components/projects/ProjectCard';
import type { ProjectListData } from '@/utils/projects/project-types';

type ProjectListProps = {
  data: ProjectListData;
};

export function ProjectList({ data }: ProjectListProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
            Projects
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            Project workspace
          </h1>
          <p className="max-w-2xl text-sm text-[var(--text-secondary)] sm:text-base">
            Everything in AI Business OS revolves around projects. OSA, documents, CRM, knowledge,
            and automation attach here.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          New project
        </button>
      </header>

      {data.projects.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)] p-8 text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)]">No projects yet</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Create your first project to connect OSA, documents, CRM, and knowledge in one place.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Create project
          </button>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
