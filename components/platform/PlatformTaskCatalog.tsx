import Link from 'next/link';

import type { PlatformTask } from '@/utils/platform/business-zavod-config';

type PlatformTaskCatalogProps = {
  tasks: PlatformTask[];
  compact?: boolean;
};

export function PlatformTaskCatalog({ tasks, compact = false }: PlatformTaskCatalogProps) {
  return (
    <div
      className={
        compact
          ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'
          : 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
      }
    >
      {tasks.map((task, index) => {
        const href = task.href ?? `/home?prompt=${encodeURIComponent(task.prompt)}`;

        return (
          <Link
            key={task.id}
            href={href}
            aria-label={`${task.title}: ${task.description}`}
            className="group relative min-h-[180px] overflow-hidden rounded-[24px] border border-white/[0.10] bg-[linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.015))] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#69e4ee]/30 hover:bg-[#69e4ee]/[0.04] hover:shadow-[0_24px_60px_-38px_rgba(105,228,238,.28)]"
          >
            <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(241,201,108,.10),transparent_70%)] transition duration-300 group-hover:scale-125" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[12px] font-black uppercase tracking-[.14em] text-[#79eaf2]">
                  LINE {String(index + 1).padStart(2, '0')}
                </span>
                {task.badge ? (
                  <span className="rounded-full border border-[#f1c96c]/20 bg-[#f1c96c]/[0.06] px-2.5 py-1 text-[11px] font-bold text-[#f4d878]">
                    {task.badge}
                  </span>
                ) : (
                  <span className="text-xl text-white/42 transition group-hover:translate-x-1 group-hover:text-[#69e4ee]">
                    ↗
                  </span>
                )}
              </div>

              <h3 className="mt-5 text-xl font-black tracking-[-.025em] text-[#fff8e7]">
                {task.title}
              </h3>
              <p className="mt-2 text-base leading-7 text-white/72">
                {task.description}
              </p>

              <span className="mt-auto pt-5 text-sm font-black text-[#f1c96c]">
                Запустить линию →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
