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
      className="group inline-flex h-14 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-6 text-base font-extrabold text-[#181006] shadow-[0_16px_34px_-20px_rgba(241,201,108,.9)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
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
            <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] border border-[#f1c96c]/25 bg-[#0b0e14] text-[13px] font-black tracking-[.08em] text-[#f1c96c] shadow-[0_0_30px_rgba(241,201,108,.08)]">
              БЗ
              <span className="absolute inset-x-1 bottom-1 h-px bg-[linear-gradient(90deg,transparent,#69e4ee,transparent)]" />
            </span>
            <span>
              <span className="block text-[14px] font-black tracking-[0.18em] text-[#fff8e7]">БИЗНЕС ЗАВОД</span>
              <span className="block text-[12px] uppercase tracking-[0.16em] text-white/68">OSA OPERATING SYSTEM</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.055] px-3.5 py-2 text-[12px] font-bold tracking-[.1em] text-emerald-200/90">
              ● FACTORY ONLINE
            </span>
            <span className="rounded-full border border-white/[0.09] px-3.5 py-2 text-[12px] tracking-[.08em] text-white/70">
              AI TEAM READY
            </span>
          </div>

          <Link
            href="/login/sign-in"
            className="rounded-[14px] border border-white/[0.12] bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white/90 backdrop-blur transition hover:border-[#69e4ee]/30 hover:bg-white/[0.07] hover:text-white"
          >
            Войти
          </Link>
        </header>

        <section className="grid min-h-[720px] items-center gap-8 py-8 xl:grid-cols-[.92fr_1.08fr] xl:gap-10 xl:py-10">
          <div className="relative z-[2] max-w-[740px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#69e4ee]/18 bg-[#69e4ee]/[0.055] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#a8f2f7]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#69e4ee] shadow-[0_0_12px_rgba(105,228,238,.8)]" />
              Не чат. Не каталог AI. Рабочий завод.
            </div>

            <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#7beaf3]">
              AI-ПЛАТФОРМА ДЛЯ РЕАЛЬНОГО БИЗНЕСА
            </p>

            <h1 className="mt-4 max-w-[760px] text-[clamp(3.65rem,6.35vw,7.05rem)] font-black leading-[.86] tracking-[-0.07em] text-[#fff8e7]">
              Превращаем
              <span className="block bg-[linear-gradient(180deg,#fff0ad_0%,#f4cf6a_34%,#d99a2d_78%,#f7d575_100%)] bg-clip-text text-transparent">
                идеи в готовый
              </span>
              <span className="block bg-[linear-gradient(180deg,#fff0ad_0%,#f4cf6a_34%,#d99a2d_78%,#f7d575_100%)] bg-clip-text text-transparent">
                результат
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78 sm:text-[1.15rem] sm:leading-8">
              OSA сама собирает нужный цех: стратегия, аналитика, визуал, видео, продажи и
              автоматизация. Вы ставите задачу — завод возвращает готовый результат.
            </p>

            <form
              action={generateFirstPlan}
              className="mt-7 overflow-hidden rounded-[26px] border border-[#69e4ee]/18 bg-[#090d14]/94 p-3.5 shadow-[0_0_0_1px_rgba(105,228,238,.035),0_28px_90px_-40px_rgba(0,0,0,.98),0_0_55px_-30px_rgba(105,228,238,.5)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between px-2 pb-2">
                <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/72">
                  DIRECTOR CONSOLE
                </span>
                <span className="text-[12px] font-semibold text-[#9af1f7]">OSA слушает</span>
              </div>
              <label htmlFor="bz-task" className="sr-only">Что нужно сделать</label>
              <textarea
                id="bz-task"
                name="task"
                value={task}
                onChange={(event) => setTask(event.target.value)}
                rows={3}
                placeholder="Напиши задачу обычными словами…"
                className="min-h-[138px] w-full resize-none rounded-[18px] border border-white/[0.11] bg-black/30 px-5 py-5 text-lg leading-8 text-[#fff8e7] outline-none placeholder:text-white/58 focus:border-[#69e4ee]/35 focus:shadow-[0_0_35px_-20px_rgba(105,228,238,.65)]"
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2 px-1">
                  {['AI-директор', 'Файлы', 'Медиа', 'Инструменты'].map((label, index) => (
                    <span
                      key={label}
                      className={index === 0
                        ? 'rounded-full border border-[#69e4ee]/18 bg-[#69e4ee]/[0.055] px-3.5 py-2 text-[12px] font-semibold text-[#a8f2f7]'
                        : 'rounded-full border border-white/[0.09] px-3.5 py-2 text-[12px] text-white/62'}
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
                  className="rounded-full border border-white/[0.09] bg-white/[0.035] px-3.5 py-2.5 text-[12px] text-white/64 transition hover:border-[#69e4ee]/16 hover:bg-white/[0.045] hover:text-white/60"
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="mt-6 grid max-w-2xl grid-cols-3 gap-2">
              {[
                ['7', 'цехов'],
                ['1', 'AI-директор'],
                ['∞', 'комбинаций'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-[16px] border border-white/[0.055] bg-white/[0.02] px-4 py-3"
                >
                  <p className="text-2xl font-semibold text-[#fff8e7]">{value}</p>
                  <p className="mt-1 text-[12px] uppercase tracking-[.09em] text-white/68">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.stage}>
            <div className="relative z-[2] mx-auto w-full max-w-[690px] pb-5">
              <BusinessFactoryHero />
            </div>

            <div className="relative z-[3] mt-5 grid gap-3 md:grid-cols-[1.12fr_.88fr] xl:gap-4">
              <div className="rounded-[24px] border border-[#69e4ee]/18 bg-[#050a11]/88 p-5 shadow-[0_24px_80px_-42px_rgba(0,0,0,.95),0_0_46px_-24px_rgba(105,228,238,.5)] backdrop-blur-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#87eef5]">
                      LIVE FACTORY
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-[#fff8e7]">OSA собирает нужный цех</p>
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
                        <span className="truncate text-[12px] font-semibold text-white/82">{name}</span>
                        <span className={index < 2 ? 'text-[11px] font-semibold text-emerald-200/88' : 'text-[11px] font-semibold text-[#f1c96c]/90'}>
                          {status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#f1c96c]/22 bg-[linear-gradient(145deg,rgba(241,201,108,.07),rgba(105,228,238,.025))] p-5 shadow-[0_24px_70px_-44px_rgba(0,0,0,.92),0_0_42px_-24px_rgba(241,201,108,.4)] backdrop-blur-2xl">
                <p className="text-[12px] font-black uppercase tracking-[.14em] text-[#f5d277]">OUTPUT</p>
                <div className="mt-4 space-y-2">
                  {['Видео', 'Визуал', 'Продажи', 'Аналитика'].map((item, index) => (
                    <div key={item} className="flex items-center justify-between text-[12px]">
                      <span className="text-white/72">{item}</span>
                      <span className={index < 3 ? 'font-semibold text-emerald-200/82' : 'font-semibold text-white/68'}>
                        {index < 3 ? 'READY' : 'NEXT'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full w-[82%] bg-[linear-gradient(90deg,#69e4ee,#f1c96c)] shadow-[0_0_12px_rgba(105,228,238,.45)]" />
                </div>
                <p className="mt-2 text-right text-[12px] font-semibold text-white/68">82%</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] py-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#f1c96c]">PRODUCTION LINES</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-[#fff8e7] sm:text-4xl">
                Не сервисы. Цеха результата.
              </h2>
            </div>
            <p className="max-w-lg text-base leading-7 text-white/68">
              Пользователь ставит задачу. Завод сам выбирает людей, AI, инструменты и порядок работы.
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {LINES.map(([number, title, text]) => (
              <div
                key={title}
                className="group relative min-h-[150px] overflow-hidden rounded-[22px] border border-white/[0.10] bg-white/[0.032] p-6 transition hover:-translate-y-0.5 hover:border-[#69e4ee]/16 hover:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[12px] font-black tracking-[.14em] text-[#8df0f6]">LINE {number}</span>
                    <h3 className="mt-4 text-xl font-bold tracking-[.05em] text-[#fff8e7]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/66">{text}</p>
                  </div>
                  <span className="mt-1 text-lg text-white/62 transition group-hover:text-[#69e4ee]/55">↗</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/[0.08] py-8 text-[13px] uppercase tracking-[.09em] text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <span>BUSINESS ZAVOD · OSA INSIDE · 2026</span>
          <span>Задача → Производство → Проверка → Результат</span>
        </footer>
      </div>
    </main>
  );
}
