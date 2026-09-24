import Link from 'next/link';

import { FACTORY_RECIPES } from '@/utils/platform/factory-library';

export default function FactoriesPage() {
  return (
    <main className="mx-auto w-full max-w-[1320px] pb-16 text-[#f7f2e8]">
      <section className="rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#05070b,#0b1018_58%,#06080c)] p-6 sm:p-8">
        <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#79eaf2]">БИЗНЕС-ЗАВОД · ГОТОВЫЕ ЗАВОДЫ</p>
        <h1 className="mt-3 text-[clamp(2.8rem,5vw,5.2rem)] font-black leading-[.94] tracking-[-.055em] text-[#fff8e7]">
          Не промпты.
          <span className="block text-[#f1c96c]">Готовые производственные линии.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
          Выберите сценарий — OSA сама разложит его на цеха, параллельные этапы и результаты.
        </p>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FACTORY_RECIPES.map((recipe) => (
          <Link
            key={recipe.id}
            href={'/home?prompt=' + encodeURIComponent(recipe.prompt)}
            className="group rounded-[26px] border border-white/[0.09] bg-[#080c12] p-5 transition hover:-translate-y-1 hover:border-[#f1c96c]/25"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-3xl">{recipe.mark}</span>
              <span className="rounded-full border border-emerald-300/12 bg-emerald-300/[0.045] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-emerald-200">готов</span>
            </div>
            <h2 className="mt-5 text-2xl font-black text-[#fff8e7]">{recipe.title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/52">{recipe.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {recipe.outputs.map((output) => (
                <span key={output} className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-bold text-white/58">
                  {output}
                </span>
              ))}
            </div>
            <span className="mt-6 inline-flex text-sm font-black text-[#f1c96c]">Запустить завод →</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
