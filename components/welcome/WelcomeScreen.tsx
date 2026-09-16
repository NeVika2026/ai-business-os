'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { generateFirstPlan } from '@/app/login/actions';
import { BusinessFactoryHero } from '@/components/home/BusinessFactoryHero';
import styles from '@/components/welcome/WelcomeScreen.module.css';

const QUICK_TASKS = [
  'Сделай рекламный ролик для моего продукта',
  'Найди клиентов для моей услуги',
  'Собери презентацию для продажи',
  'Разбери конкурентов и предложи отстройку',
] as const;

const LINES = [
  ['01', 'СОЗДАТЬ', 'Видео · визуал · документы'],
  ['02', 'ПРОДАТЬ', 'Офферы · скрипты · воронки'],
  ['03', 'ПРОДВИНУТЬ', 'Контент · реклама · трафик'],
  ['04', 'НАЙТИ', 'Клиенты · партнёры · возможности'],
  ['05', 'АНАЛИЗ', 'Рынок · риски · решения'],
  ['06', 'АВТОМАТИЗИРОВАТЬ', 'Рутина · процессы · лиды'],
] as const;

const AGENTS = [
  ['AI-маркетолог', 'ONLINE'],
  ['AI-продажник', 'ONLINE'],
  ['AI-контентмейкер', 'READY'],
  ['AI-аналитик', 'READY'],
] as const;

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="group inline-flex h-12 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-5 text-sm font-extrabold text-[#181006] shadow-[0_16px_34px_-20px_rgba(241,201,108,.9)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
    >
      {pending ? 'OSA запускает завод…' : 'Запустить производство →'}
    </button>
  );
}

export function WelcomeScreen() {
  const [task, setTask] = useState('');
  const examples = useMemo(() => QUICK_TASKS, []);
  const canSubmit = task.trim().length > 2;

  return (
    <main className={styles.screen}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-[1480px] px-5 pb-20 sm:px-8 lg:px-10">
        <header className="flex h-20 items-center justify-between border-b border-white/[0.07]">
          <Link href="/login" className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] border border-[#f1c96c]/25 bg-[#0b0e14] text-[11px] font-black tracking-[.08em] text-[#f1c96c] shadow-[0_0_30px_rgba(241,201,108,.08)]">
              БЗ
              <span className="absolute inset-x-1 bottom-1 h-px bg-[linear-gradient(90deg,transparent,#69e4ee,transparent)]" />
            </span>
            <span>
              <span className="block text-[12px] font-black tracking-[0.22em] text-[#fff8e7]">БИЗНЕС ЗАВОД</span>
              <span className="block text-[9px] uppercase tracking-[0.22em] text-white/28">OSA OPERATING SYSTEM</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-full border border-emerald-300/10 bg-emerald-300/[0.04] px-3 py-1.5 text-[9px] font-bold tracking-[.14em] text-emerald-200/70">
              ● FACTORY ONLINE
            </span>
            <span className="rounded-full border border-white/[0.07] px-3 py-1.5 text-[9px] tracking-[.12em] text-white/30">
              AI TEAM READY
            </span>
          </div>

          <Link
            href="/login/sign-in"
            className="rounded-[14px] border border-white/[0.09] bg-white/[0.045] px-4 py-2.5 text-xs font-semibold text-white/75 backdrop-blur transition hover:border-[#69e4ee]/30 hover:bg-white/[0.07] hover:text-white"
          >
            Войти
          </Link>
        </header>

        <section className="grid min-h-[800px] items-center gap-8 py-10 xl:grid-cols-[.9fr_1.1fr] xl:gap-12 xl:py-14">
          <div className="relative z-[2] max-w-[740px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#69e4ee]/14 bg-[#69e4ee]/[0.045] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9debf2]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#69e4ee] shadow-[0_0_12px_rgba(105,228,238,.8)]" />
              Не чат. Не каталог AI. Рабочий завод.
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#69e4ee]">
              AI-ПЛАТФОРМА ДЛЯ РЕАЛЬНОГО БИЗНЕСА
            </p>

            <h1 className="mt-4 max-w-[760px] text-[clamp(3.8rem,7vw,7.7rem)] font-black leading-[.82] tracking-[-0.075em] text-[#fff8e7]">
              Превращаем
              <span className="block bg-[linear-gradient(180deg,#fff0ad_0%,#f4cf6a_34%,#d99a2d_78%,#f7d575_100%)] bg-clip-text text-transparent">
                идеи в готовый
              </span>
              <span className="block bg-[linear-gradient(180deg,#fff0ad_0%,#f4cf6a_34%,#d99a2d_78%,#f7d575_100%)] bg-clip-text text-transparent">
                результат
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-sm leading-6 text-white/48 sm:text-base sm:leading-7">
              OSA сама собирает нужный цех: стратегия, аналитика, визуал, видео, продажи и
              автоматизация. Вы ставите задачу — завод возвращает готовый результат.
            </p>

            <form
              action={generateFirstPlan}
              className="mt-8 overflow-hidden rounded-[26px] border border-[#69e4ee]/18 bg-[#090d14]/94 p-3.5 shadow-[0_0_0_1px_rgba(105,228,238,.035),0_28px_90px_-40px_rgba(0,0,0,.98),0_0_55px_-30px_rgba(105,228,238,.5)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between px-2 pb-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.17em] text-white/25">
                  DIRECTOR CONSOLE
                </span>
                <span className="text-[9px] text-[#69e4ee]/60">OSA слушает</span>
              </div>
              <label htmlFor="bz-task" className="sr-only">Что нужно сделать</label>
              <textarea
                id="bz-task"
                name="task"
                value={task}
                onChange={(event) => setTask(event.target.value)}
                rows={3}
                placeholder="Напиши задачу обычными словами…"
                className="min-h-[128px] w-full resize-none rounded-[18px] border border-white/[0.07] bg-black/30 px-4 py-4 text-base leading-7 text-[#fff8e7] outline-none placeholder:text-white/22 focus:border-[#69e4ee]/35 focus:shadow-[0_0_35px_-20px_rgba(105,228,238,.65)]"
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2 px-1">
                  {['AI-директор', 'Файлы', 'Медиа', 'Инструменты'].map((label, index) => (
                    <span
                      key={label}
                      className={index === 0
                        ? 'rounded-full border border-[#69e4ee]/13 bg-[#69e4ee]/[0.045] px-3 py-1.5 text-[10px] font-semibold text-[#9debf2]'
                        : 'rounded-full border border-white/[0.06] px-3 py-1.5 text-[10px] text-white/28'}
                    >
                      {label}
                    </span>
                  ))}
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
                  className="rounded-full border border-white/[0.065] bg-white/[0.025] px-3 py-2 text-[10px] text-white/32 transition hover:border-[#69e4ee]/16 hover:bg-white/[0.045] hover:text-white/60"
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-2">
              {[
                ['7', 'цехов'],
                ['1', 'AI-директор'],
                ['∞', 'комбинаций'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[16px] border border-white/[0.055] bg-white/[0.02] px-4 py-3"
                >
                  <p className="text-lg font-semibold text-[#fff8e7]">{value}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[.12em] text-white/22">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.stage}>
            <div className="relative z-[2] mx-auto w-full max-w-[690px]">
              <BusinessFactoryHero />
            </div>

            <div className="relative z-[3] -mt-7 grid gap-3 md:grid-cols-[1.12fr_.88fr] xl:gap-4">
              <div className="rounded-[24px] border border-[#69e4ee]/18 bg-[#050a11]/88 p-5 shadow-[0_24px_80px_-42px_rgba(0,0,0,.95),0_0_46px_-24px_rgba(105,228,238,.5)] backdrop-blur-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#69e4ee]">
                      LIVE FACTORY
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#fff8e7]">OSA собирает нужный цех</p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,255,179,.85)]" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {AGENTS.map(([name, status], index) => (
                    <div
                      key={name}
                      className={[styles.metricLine, 'rounded-[14px] border border-white/[0.065] bg-white/[0.028] px-3 py-2.5'].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[10px] font-semibold text-white/70">{name}</span>
                        <span className={index < 2 ? 'text-[8px] text-emerald-200/65' : 'text-[8px] text-[#f1c96c]/65'}>
                          {status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#f1c96c]/22 bg-[linear-gradient(145deg,rgba(241,201,108,.07),rgba(105,228,238,.025))] p-5 shadow-[0_24px_70px_-44px_rgba(0,0,0,.92),0_0_42px_-24px_rgba(241,201,108,.4)] backdrop-blur-2xl">
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f1c96c]">OUTPUT</p>
                <div className="mt-4 space-y-2">
                  {['Видео', 'Визуал', 'Продажи', 'Аналитика'].map((item, index) => (
                    <div key={item} className="flex items-center justify-between text-[10px]">
                      <span className="text-white/45">{item}</span>
                      <span className={index < 3 ? 'text-emerald-200/60' : 'text-white/25'}>
                        {index < 3 ? 'READY' : 'NEXT'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full w-[82%] bg-[linear-gradient(90deg,#69e4ee,#f1c96c)] shadow-[0_0_12px_rgba(105,228,238,.45)]" />
                </div>
                <p className="mt-2 text-right text-[9px] text-white/24">82%</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] py-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#f1c96c]">PRODUCTION LINES</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em] text-[#fff8e7] sm:text-3xl">
                Не сервисы. Цеха результата.
              </h2>
            </div>
            <p className="max-w-md text-xs leading-5 text-white/28">
              Пользователь ставит задачу. Завод сам выбирает людей, AI, инструменты и порядок работы.
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {LINES.map(([number, title, text]) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-white/[0.018] p-4 transition hover:-translate-y-0.5 hover:border-[#69e4ee]/16 hover:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-black tracking-[.18em] text-[#69e4ee]/55">LINE {number}</span>
                    <h3 className="mt-4 text-sm font-bold tracking-[.08em] text-[#fff8e7]">{title}</h3>
                    <p className="mt-1 text-[10px] leading-5 text-white/28">{text}</p>
                  </div>
                  <span className="mt-1 text-white/12 transition group-hover:text-[#69e4ee]/55">↗</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/[0.06] py-8 text-[10px] uppercase tracking-[.12em] text-white/22 sm:flex-row sm:items-center sm:justify-between">
          <span>BUSINESS ZAVOD · OSA INSIDE · 2026</span>
          <span>Задача → Производство → Проверка → Результат</span>
        </footer>
      </div>
    </main>
  );
}
