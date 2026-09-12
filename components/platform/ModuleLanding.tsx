import Link from 'next/link';

import { PlatformTaskCatalog } from '@/components/platform/PlatformTaskCatalog';
import type { PlatformModule, PlatformTask } from '@/utils/platform/business-zavod-config';

type ModuleLandingProps = {
  module: PlatformModule;
  tasks: PlatformTask[];
};

export function ModuleLanding({ module, tasks }: ModuleLandingProps) {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-8">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,.18),transparent_42%),linear-gradient(135deg,#111827,#090b12)] p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Бизнес Завод · {module.label}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {module.label}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/60">
              {module.description}. Выбери готовую задачу или вернись к AI-директору и скажи цель своими словами.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl">
            {module.icon}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/home"
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
          >
            Сказать задачу OSA
          </Link>
          <Link
            href="/projects"
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Открыть проекты
          </Link>
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">С чего начать</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Выбор только заполняет задачу — запуск остаётся под твоим контролем.
          </p>
        </div>
        <PlatformTaskCatalog tasks={tasks} />
      </div>
    </section>
  );
}
