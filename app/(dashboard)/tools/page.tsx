import Link from 'next/link';

import { FACTORY_TOOLS } from '@/utils/platform/factory-library';

function toolHref(tool: { id?: string; mode?: string; href?: string }) {
  if (tool.id === 'avatar') return '/modules/create/avatar?mode=text';
  if (tool.id === 'lip-sync') return '/modules/create/avatar?mode=audio';
  if (tool.href) return tool.href;
  return '/modules/create/studio?mode=' + encodeURIComponent(tool.mode ?? 'video');
}

export default function ToolsPage() {
  return (
    <main className="mx-auto w-full max-w-[1320px] pb-16 text-[#f7f2e8]">
      <section className="rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#05070b,#0b1018_58%,#06080c)] p-6 sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#79eaf2]">БИЗНЕС-ЗАВОД · ИНСТРУМЕНТЫ</p>
        <h1 className="mt-3 text-[clamp(2.8rem,5vw,5.2rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Все мощности
          <span className="block text-[#f1c96c]">в одном цехе.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Обычный режим выбирает инструменты автоматически. Здесь можно открыть нужный цех вручную.
        </p>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {FACTORY_TOOLS.map((tool) =>
          (tool.status === 'live' && (tool.mode || tool.href)) || tool.id === 'avatar' || tool.id === 'lip-sync' ? (
            <Link
              key={tool.id}
              href={toolHref(tool)}
              className="group min-h-52 rounded-[24px] border border-white/[0.09] bg-[#080c12] p-5 transition hover:-translate-y-1 hover:border-[#69e4ee]/25"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#69e4ee]/15 bg-[#69e4ee]/[0.05] text-xl text-[#9af5fb]">{tool.mark}</span>
              <h2 className="mt-5 text-xl font-black text-[#fff8e7]">{tool.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/52">{tool.description}</p>
              <span className="mt-5 inline-flex text-sm font-black text-[#9af5fb]">Открыть →</span>
            </Link>
          ) : (
            <article key={tool.id} className="min-h-52 rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-5 opacity-70">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-xl text-white/52">{tool.mark}</span>
                <span className="rounded-full border border-[#f1c96c]/16 bg-[#f1c96c]/[0.05] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-[#f1c96c]">скоро</span>
              </div>
              <h2 className="mt-5 text-xl font-black text-[#fff8e7]">{tool.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/46">{tool.description}</p>
            </article>
          ),
        )}
      </section>
    </main>
  );
}
