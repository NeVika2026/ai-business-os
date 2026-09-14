'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { RealMediaProductionPanel } from '@/components/platform/RealMediaProductionPanel';
import {
  CREATE_STUDIO_MODES,
  buildCreateStudioPrompt,
  getCreateStudioMode,
  getCreateStudioProductionLine,
  type CreateStudioModeId,
} from '@/utils/platform/create-studio';

type CreateStudioProps = {
  initialModeId?: CreateStudioModeId;
};

export function CreateStudio({ initialModeId = 'video' }: CreateStudioProps) {
  const router = useRouter();
  const [modeId, setModeId] = useState<CreateStudioModeId>(
    getCreateStudioMode(initialModeId).id,
  );
  const [goal, setGoal] = useState('');
  const [audience, setAudience] = useState('');
  const [format, setFormat] = useState('');
  const [context, setContext] = useState('');

  const mode = getCreateStudioMode(modeId);
  const productionLine = getCreateStudioProductionLine(modeId);
  const canContinue = goal.trim().length > 0;

  const handoffToOsa = () => {
    if (!canContinue) return;

    const prompt = buildCreateStudioPrompt({
      modeId,
      goal,
      audience,
      format,
      context,
    });

    router.push('/home?prompt=' + encodeURIComponent(prompt));
  };

  return (
    <main className="relative mx-auto w-full max-w-[1320px] overflow-hidden pb-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(231,185,82,.12),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[35%] top-28 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(88,219,232,.07),transparent_70%)] blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[linear-gradient(145deg,#080b11,#0c111a_55%,#080a0f)] p-6 text-white shadow-[0_28px_90px_-55px_rgba(0,0,0,.95)] sm:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] [background-size:38px_38px] [mask-image:radial-gradient(circle_at_70%_40%,#000,transparent_78%)]"
        />
        <div className="relative grid gap-7 xl:grid-cols-[1.05fr_.95fr] xl:items-end">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#e7b952]">
              Бизнес-Завод · Цех создания
            </p>
            <h1 className="mt-4 max-w-4xl text-[clamp(2.4rem,5vw,4.9rem)] font-semibold leading-[.96] tracking-[-0.06em] text-[#fff8e7]">
              Из идеи — в готовый результат
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-white/48 sm:text-base sm:leading-7">
              Идею можно описать одной фразой. AI-директор сам разложит её на производство:
              сценарий, визуал, голос, монтаж, проверку и экспорт.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#58dbe8]/10 bg-[#58dbe8]/[0.035] p-4 backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#58dbe8]">
                  Производственная линия
                </p>
                <p className="mt-1 text-sm font-semibold text-[#f7f2e8]">{mode.label}</p>
              </div>
              <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-[9px] font-bold text-emerald-200">
                READY
              </span>
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-full bg-[linear-gradient(90deg,#58dbe8,#e7b952)] opacity-75" />
            </div>
            <p className="mt-3 text-[11px] leading-5 text-white/34">
              Сначала план и подтверждение. Затратные действия запускаются только после согласования.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            Что производим
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CREATE_STUDIO_MODES.map((item) => {
              const active = item.id === modeId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModeId(item.id)}
                  aria-pressed={active}
                  className={[
                    'group rounded-[20px] border p-4 text-left transition',
                    active
                      ? 'border-[#e7b952]/40 bg-[#e7b952]/[0.07] shadow-[0_14px_30px_-24px_rgba(231,185,82,.65)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-0)] hover:border-[#58dbe8]/20 hover:bg-[var(--surface-2)]',
                  ].join(' ')}
                >
                  <span
                    className={
                      active
                        ? 'text-lg text-[#e7b952]'
                        : 'text-lg text-[var(--text-secondary)]'
                    }
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="mt-2 block text-sm font-semibold text-[var(--text-primary)]">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-[11px] leading-5 text-[var(--text-secondary)]">
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Опиши идею или результат
              </span>
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows={6}
                placeholder="Например: сделай 25-секундный ролик про страховку квартиры. Без говорящего аватара, с крупными русскими субтитрами."
                className="resize-none rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3.5 text-sm leading-6 text-[var(--text-primary)] outline-none transition focus:border-[#e7b952]/40"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Для кого <span className="font-normal text-[var(--text-secondary)]">· необязательно</span>
              </span>
              <input
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                placeholder="Например: владельцы ипотечных квартир"
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[#58dbe8]/30"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Формат <span className="font-normal text-[var(--text-secondary)]">· необязательно</span>
                </span>
                <input
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                  placeholder="9:16, 25 сек., Дзэн"
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[#58dbe8]/30"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Важно учесть <span className="font-normal text-[var(--text-secondary)]">· необязательно</span>
                </span>
                <input
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder="Бренд, запреты, референсы, тон"
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[#58dbe8]/30"
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            disabled={!canContinue}
            onClick={handoffToOsa}
            className="mt-6 w-full rounded-[18px] bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-5 py-4 text-sm font-extrabold text-[#181006] shadow-[0_16px_34px_-18px_rgba(231,185,82,.8)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
          >
            Передать AI-директору
          </button>

          <p className="mt-3 text-center text-[10px] leading-5 text-[var(--text-secondary)]">
            Модели и инструменты выбираются внутри платформы автоматически.
          </p>
        </div>

        <aside className="rounded-[30px] border border-white/[0.08] bg-[#080b11] p-5 text-white sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#58dbe8]">
                Производственная линия
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#fff8e7]">
                {mode.label}
              </h2>
            </div>
            <span className="text-[10px] font-bold text-white/30">
              {productionLine.length} этапов
            </span>
          </div>

          <div className="mt-5 grid gap-2">
            {productionLine.map((stage, index) => (
              <div
                key={stage.id}
                className="group relative grid grid-cols-[34px_1fr_auto] items-center gap-3 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-3.5 py-3 transition hover:border-[#58dbe8]/15 hover:bg-white/[0.035]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#e7b952]/14 bg-[#e7b952]/[0.045] text-[10px] font-extrabold text-[#e7b952]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#fff8e7]">{stage.label}</p>
                  <p className="mt-0.5 truncate text-[10px] text-white/28">{stage.detail}</p>
                </div>
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[#58dbe8]/55 shadow-[0_0_8px_rgba(88,219,232,.35)]"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[20px] border border-[#e7b952]/12 bg-[#e7b952]/[0.035] p-4">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#e7b952]">
              Контроль качества
            </p>
            <p className="mt-2 text-[11px] leading-5 text-white/36">
              Для видео и серий визуалов система должна сохранять одинаковых героев,
              интерьер, реквизит, свет и стиль между сценами. Перед экспортом — отдельная проверка.
            </p>
          </div>
        </aside>
      </section>

      <RealMediaProductionPanel key={modeId} modeId={modeId} prompt={goal} format={format} />
    </main>
  );
}
