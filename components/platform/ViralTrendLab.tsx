'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  buildViralPresetHref,
  VIRAL_CATEGORY_LABELS,
  VIRAL_PRESETS,
} from '@/utils/platform/viral-presets';

type FilterId = 'all' | keyof typeof VIRAL_CATEGORY_LABELS;

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'visual', label: 'Визуалы' },
  { id: 'video', label: 'Видео' },
  { id: 'ugc', label: 'UGC / аватары' },
  { id: 'voice', label: 'Голос' },
  { id: 'business', label: 'Бизнес' },
];

export function ViralTrendLab() {
  const [filter, setFilter] = useState<FilterId>('all');

  const items = useMemo(
    () =>
      filter === 'all'
        ? VIRAL_PRESETS
        : VIRAL_PRESETS.filter((item) => item.category === filter),
    [filter],
  );

  const readyCount = VIRAL_PRESETS.filter((item) => item.status === 'ready').length;

  return (
    <main className="relative mx-auto w-full max-w-[1320px] overflow-hidden pb-16 text-[#f7f2e8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,rgba(105,228,238,.12),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[18%] top-44 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(241,201,108,.10),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.09] bg-[linear-gradient(145deg,#06090e,#0b1119_56%,#06080c)] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative grid gap-7 xl:grid-cols-[1fr_.72fr] xl:items-end">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[.18em] text-[#79eaf2]">
              БИЗНЕС ЗАВОД · TREND LAB
            </p>
            <h1 className="mt-4 max-w-4xl text-[clamp(3rem,5vw,5.5rem)] font-black leading-[.92] tracking-[-.065em] text-[#fff8e7]">
              Вирусные AI-механики
              <span className="block bg-[linear-gradient(180deg,#fff0ad,#d99a2d)] bg-clip-text text-transparent">
                в один клик.
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
              Не коллекция промптов. Это готовые производственные пресеты: визуалы, product-video,
              UGC, голос, сайты и AI-звонки. Нажимаете карточку — нужный цех открывается уже с задачей.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#69e4ee]/12 bg-[#69e4ee]/[0.035] p-5">
            <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#79eaf2]">
              СЕЙЧАС ДОСТУПНО
            </p>
            <p className="mt-2 text-4xl font-black text-[#fff8e7]">
              {readyCount}
              <span className="ml-2 text-base font-bold text-white/44">пресетов</span>
            </p>
            <p className="mt-3 text-sm leading-6 text-white/58">
              Карточки NEXT уже стоят в интерфейсе и будут включаться по мере подключения внешних движков.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={[
                'rounded-full border px-4 py-2.5 text-sm font-bold transition',
                filter === item.id
                  ? 'border-[#f1c96c]/28 bg-[#f1c96c]/[0.07] text-[#f4d878]'
                  : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-[#69e4ee]/20 hover:text-white',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((preset, index) => (
            <Link
              key={preset.id}
              href={buildViralPresetHref(preset)}
              className="group relative min-h-[220px] overflow-hidden rounded-[26px] border border-white/[0.085] bg-[linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.015))] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#69e4ee]/28 hover:bg-[#69e4ee]/[0.035]"
            >
              <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(241,201,108,.09),transparent_70%)] transition duration-300 group-hover:scale-125" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[.13em] text-[#79eaf2]">
                    {String(index + 1).padStart(2, '0')} · {VIRAL_CATEGORY_LABELS[preset.category]}
                  </span>
                  <span
                    className={[
                      'rounded-full border px-2.5 py-1 text-[10px] font-black',
                      preset.status === 'ready'
                        ? 'border-emerald-300/14 bg-emerald-300/[0.05] text-emerald-200'
                        : 'border-[#f1c96c]/16 bg-[#f1c96c]/[0.04] text-[#f4d878]',
                    ].join(' ')}
                  >
                    {preset.status === 'ready' ? preset.badge : preset.badge + ' · КОННЕКТОР'}
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-black tracking-[-.03em] text-[#fff8e7]">
                  {preset.title}
                </h2>
                <p className="mt-2 text-base leading-7 text-white/66">
                  {preset.description}
                </p>

                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="text-xs font-black uppercase tracking-[.1em] text-[#f1c96c]">
                    {preset.status === 'ready' ? 'Запустить →' : 'Подключить →'}
                  </span>
                  <span className="text-xl text-white/34 transition group-hover:translate-x-1 group-hover:text-[#69e4ee]">
                    ↗
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
