'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { generateFirstPlan } from '@/app/login/actions';

const QUICK_TASKS = [
  'Сделай рекламный ролик для моего продукта',
  'Найди клиентов для моей услуги',
  'Собери презентацию для продажи',
  'Разбери конкурентов и предложи отстройку',
] as const;

const MODULES = [
  { title: 'Создать', text: 'Видео, картинки, сторис, презентации и документы', mark: '✦' },
  { title: 'Продать', text: 'Офферы, скрипты, воронки и коммерческие предложения', mark: '₽' },
  { title: 'Продвинуть', text: 'Контент, реклама и полноценные маркетинговые комплекты', mark: '↗' },
  { title: 'Найти', text: 'Клиенты, объекты, партнёры и новые возможности', mark: '⌕' },
  { title: 'Проанализировать', text: 'Конкуренты, данные, риски и варианты решений', mark: '◫' },
  { title: 'Автоматизировать', text: 'Повторяющиеся процессы и рабочие цепочки', mark: '⚡' },
] as const;

const SCENARIOS = [
  { title: 'Фото → рекламный ролик', badge: 'Видео', meta: 'Сценарий · сцены · голос · монтаж' },
  { title: 'Услуга → полный маркетинг', badge: 'Маркетинг', meta: 'Оффер · ЦА · контент · реклама' },
  { title: 'Объект → сторис и посты', badge: 'Контент', meta: 'Хуки · визуалы · CTA' },
  { title: 'Идея → презентация', badge: 'Документы', meta: 'Структура · тексты · подача' },
] as const;

const TEAM = [
  ['AI-маркетолог', 'Продвижение и офферы'],
  ['AI-продажник', 'Скрипты и воронки'],
  ['AI-контентмейкер', 'Видео и визуалы'],
  ['AI-аналитик', 'Исследования и решения'],
] as const;

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#17151f] px-5 text-sm font-semibold text-white shadow-[0_12px_32px_-18px_rgba(23,21,31,.9)] transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? 'OSA собирает первый результат…' : 'Запустить задачу →'}
    </button>
  );
}

export function WelcomeScreen() {
  const [task, setTask] = useState('');

  const examples = useMemo(() => QUICK_TASKS, []);
  const canSubmit = task.trim().length > 2;

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#f7f6f2] text-[#17151f]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-8 h-[380px] w-[380px] rounded-full bg-[#d9efff] blur-3xl opacity-70" />
        <div className="absolute right-[-120px] top-[140px] h-[420px] w-[420px] rounded-full bg-[#f4d7ff] blur-3xl opacity-55" />
        <div className="absolute left-[34%] top-[520px] h-[300px] w-[300px] rounded-full bg-[#fff0c9] blur-3xl opacity-55" />
      </div>

      <div className="relative mx-auto w-full max-w-[1280px] px-5 pb-16 sm:px-8 lg:px-10">
        <header className="flex h-20 items-center justify-between border-b border-black/[0.06]">
          <Link href="/login" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#17151f] text-sm font-bold text-white shadow-sm">
              БЗ
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.16em]">БИЗНЕС ЗАВОД</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-black/40">OSA inside</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-black/55 md:flex">
            <a href="#possibilities" className="transition hover:text-black">Возможности</a>
            <a href="#scenarios" className="transition hover:text-black">Сценарии</a>
            <a href="#team" className="transition hover:text-black">AI-команда</a>
          </nav>

          <Link
            href="/login/sign-in"
            className="rounded-xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold shadow-sm backdrop-blur transition hover:bg-white"
          >
            Войти
          </Link>
        </header>

        <section className="grid min-h-[620px] items-center gap-10 py-14 lg:grid-cols-[1.06fr_.94fr] lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-white/70 px-3 py-2 text-xs font-medium text-black/55 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              AI-команда, которая делает работу, а не просто советует
            </div>

            <h1 className="text-[46px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[64px] lg:text-[78px]">
              Скажи, что нужно сделать.
              <span className="mt-2 block bg-gradient-to-r from-[#6258ff] via-[#a14ed5] to-[#e27477] bg-clip-text text-transparent">
                Остальное соберёт OSA.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-black/52 sm:text-lg">
              Одна платформа для контента, продаж, маркетинга, поиска, анализа и автоматизации.
              Не выбирай нейросеть — просто поставь задачу.
            </p>

            <form
              action={generateFirstPlan}
              className="mt-8 rounded-[28px] border border-black/[0.08] bg-white/85 p-3 shadow-[0_28px_90px_-54px_rgba(61,52,103,.65)] backdrop-blur-xl"
            >
              <label htmlFor="bz-task" className="sr-only">Что нужно сделать</label>
              <textarea
                id="bz-task"
                name="task"
                value={task}
                onChange={(event) => setTask(event.target.value)}
                rows={3}
                placeholder="Например: сделай серию сторис про страхование квартиры и приведи к заявке"
                className="min-h-[112px] w-full resize-none bg-transparent px-4 py-4 text-base leading-7 text-[#17151f] outline-none placeholder:text-black/30"
              />
              <div className="flex flex-col gap-3 border-t border-black/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2 px-1">
                  <span className="rounded-full bg-[#f0efff] px-3 py-1.5 text-xs font-medium text-[#6258ff]">Auto</span>
                  <span className="rounded-full bg-[#f4f4f1] px-3 py-1.5 text-xs text-black/45">Текст</span>
                  <span className="rounded-full bg-[#f4f4f1] px-3 py-1.5 text-xs text-black/45">Файлы</span>
                  <span className="rounded-full bg-[#f4f4f1] px-3 py-1.5 text-xs text-black/45">Медиа</span>
                </div>
                <SubmitButton disabled={!canSubmit} />
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setTask(example)}
                  className="rounded-full border border-black/[0.07] bg-white/55 px-3 py-2 text-xs text-black/50 backdrop-blur transition hover:bg-white hover:text-black"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute -inset-8 rounded-[44px] bg-gradient-to-br from-[#d9efff]/70 via-[#f6e5ff]/50 to-[#fff1d5]/70 blur-2xl" />
            <div className="relative overflow-hidden rounded-[36px] border border-white/80 bg-white/72 p-5 shadow-[0_35px_110px_-58px_rgba(55,47,91,.62)] backdrop-blur-2xl sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-black/35">AI-директор</p>
                  <h2 className="mt-1 text-xl font-semibold">OSA собирает команду</h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6258ff] to-[#c66ae8] text-white shadow-lg shadow-[#6258ff]/20">✦</span>
              </div>

              <div className="mt-6 rounded-[24px] bg-[#17151f] p-5 text-white">
                <p className="text-xs uppercase tracking-[0.15em] text-white/40">Задача</p>
                <p className="mt-2 text-base leading-6">Запустить продвижение услуги и собрать первые заявки.</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {TEAM.map(([name]) => (
                    <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-xs text-white/70">
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#8bffbf]" />
                      {name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-black/[0.06] bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-black/35">Результат 01</p>
                  <div className="mt-3 h-24 rounded-2xl bg-gradient-to-br from-[#d9eaff] via-[#ded9ff] to-[#ffd9e7]" />
                  <p className="mt-3 text-sm font-semibold">Креативы готовы</p>
                </div>
                <div className="rounded-[22px] border border-black/[0.06] bg-white p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-black/35">Результат 02</p>
                  <div className="mt-3 flex h-24 items-end gap-2 rounded-2xl bg-[#f5f3ef] p-3">
                    <span className="h-[38%] flex-1 rounded-t-lg bg-[#ffb86b]" />
                    <span className="h-[72%] flex-1 rounded-t-lg bg-[#766cff]" />
                    <span className="h-[54%] flex-1 rounded-t-lg bg-[#c876e6]" />
                    <span className="h-[88%] flex-1 rounded-t-lg bg-[#68c7c1]" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">Стратегия собрана</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="possibilities" className="py-12">
          <div className="mb-7 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6258ff]">Не каталог нейросетей</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Выбирай результат, а не инструмент.</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((item) => (
              <article key={item.title} className="rounded-[26px] border border-black/[0.06] bg-white/72 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0efff] text-lg text-[#6258ff]">{item.mark}</span>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/48">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="scenarios" className="py-12">
          <div className="rounded-[36px] bg-[#17151f] p-6 text-white sm:p-8 lg:p-10">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9e97ff]">Готовые сценарии</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Запуск без пустого экрана.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-white/45">Выбираешь сценарий, добавляешь исходник — OSA сама собирает рабочую цепочку.</p>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-2">
              {SCENARIOS.map((scenario, index) => (
                <article key={scenario.title} className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5 transition hover:bg-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/60">{scenario.badge}</span>
                    <span className="text-xs text-white/25">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{scenario.title}</h3>
                  <p className="mt-2 text-sm text-white/40">{scenario.meta}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="grid gap-6 py-12 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6258ff]">AI-команда</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">OSA сама решает, кого подключить.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-black/50">Маркетолог, аналитик, продажник, контентмейкер и другие специалисты работают внутри одного проекта и передают результат друг другу.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {TEAM.map(([name, role], index) => (
              <div key={name} className="flex items-center gap-4 rounded-[22px] border border-black/[0.06] bg-white/70 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#e7e7ff] to-[#f5dcff] text-sm font-bold text-[#6258ff]">{index + 1}</span>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="mt-1 text-xs text-black/42">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-6 flex flex-col gap-4 border-t border-black/[0.06] py-8 text-sm text-black/42 sm:flex-row sm:items-center sm:justify-between">
          <div>Бизнес Завод · OSA inside</div>
          <div className="flex gap-5">
            <Link href="/login/sign-in" className="hover:text-black">Войти</Link>
            <span>AI-платформа для реальной работы</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
