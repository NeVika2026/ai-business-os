import Link from 'next/link';

import { PlatformTaskCatalog } from '@/components/platform/PlatformTaskCatalog';
import type { PlatformModule, PlatformTask } from '@/utils/platform/business-zavod-config';

type ModuleLandingProps = {
  module: PlatformModule;
  tasks: PlatformTask[];
};

export function ModuleLanding({ module, tasks }: ModuleLandingProps) {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 text-[#f7f2e8]">
      <div className="relative overflow-hidden rounded-[30px] border border-white/[0.09] bg-[radial-gradient(circle_at_18%_18%,rgba(105,228,238,.11),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(241,201,108,.13),transparent_32%),linear-gradient(145deg,#06090e,#0b1018_58%,#06080c)] p-6 shadow-[0_28px_90px_-55px_rgba(0,0,0,.95)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-[13px] font-black uppercase tracking-[0.18em] text-[#79eaf2]">
              БИЗНЕС ЗАВОД · ЦЕХ
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-.05em] text-[#fff8e7] sm:text-5xl">
              {module.label}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/76">
              {module.description}. Выберите готовую производственную задачу или поставьте свою через OSA.
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#f1c96c]/20 bg-[linear-gradient(145deg,rgba(241,201,108,.11),rgba(105,228,238,.06))] text-3xl text-[#f4d878] shadow-[0_0_34px_rgba(241,201,108,.08)]">
            {module.icon}
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap gap-3">
          <Link
            href="/home"
            className="rounded-2xl bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-5 py-3 text-sm font-black text-[#1b1105] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Поставить задачу OSA →
          </Link>
          <Link
            href="/projects"
            className="rounded-2xl border border-white/12 bg-white/[0.035] px-5 py-3 text-sm font-bold text-white/82 transition hover:border-[#69e4ee]/28 hover:text-white"
          >
            Открыть проекты
          </Link>
        </div>
      </div>

      <div>
        <div className="mb-5">
          <p className="text-[12px] font-black uppercase tracking-[.16em] text-[#f1c96c]">
            ГОТОВЫЕ ЛИНИИ
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-.035em] text-[#fff8e7]">
            С чего начать
          </h2>
          <p className="mt-2 text-base leading-7 text-white/70">
            Выбор переносит готовую задачу в рабочий процесс. Формулировку можно изменить перед запуском.
          </p>
        </div>
        <PlatformTaskCatalog tasks={tasks} />
      </div>
    </section>
  );
}
