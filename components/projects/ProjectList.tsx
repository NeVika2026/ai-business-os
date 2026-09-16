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
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#79eaf2]">
            ПРОЕКТЫ
          </p>
          <h1 className="text-4xl font-black tracking-[-.045em] text-[#fff8e7] sm:text-5xl">
            Рабочие проекты
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
            Здесь собираются задачи, материалы, медиа и результаты OSA. Всё, что относится к одной бизнес-цели, остаётся в одном проекте.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          Новый проект
        </button>
      </header>

      {data.projects.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)] p-8 text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)]">Проектов пока нет</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Создайте первый проект, чтобы связать задачи OSA, документы, медиа и рабочий контекст в одном месте.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Создать проект
          </button>
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
