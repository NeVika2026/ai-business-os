'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  generateFirstPlanState,
  type GenerateFirstPlanState,
} from '@/app/login/actions';
import { BusinessFactoryHero } from '@/components/home/BusinessFactoryHero';
import styles from '@/components/welcome/WelcomeScreen.module.css';

const INITIAL_FIRST_PLAN_STATE: GenerateFirstPlanState = { status: 'idle' };

const TASK_EXAMPLES = [
  'Собери готовый лендинг для моего бизнеса',
  'Найди клиентов для моей услуги',
  'Сделай серию сторис, которая ведёт к заявке',
  'Проанализируй конкурентов и предложи отстройку',
] as const;

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex min-h-14 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#ffe08a,#d79a30)] px-6 text-sm font-black text-[#1b1105] shadow-[0_18px_42px_-24px_rgba(241,201,108,.75)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
    >
      {pending ? 'OSA собирает результат…' : 'Запустить производство →'}
    </button>
  );
}

export function FirstRequestScreen() {
  const router = useRouter();
  const [request, setRequest] = useState('');
  const [state, formAction] = useActionState(
    generateFirstPlanState,
    INITIAL_FIRST_PLAN_STATE,
  );
  const isTyping = request.trim().length > 0;

  useEffect(() => {
    if (state.status !== 'completed') return;

    try {
      window.localStorage.setItem(
        `business-zavod:first-result:${state.id}`,
        JSON.stringify(state.entry),
      );
    } catch {
      // Browser storage is only a recovery layer.
    }

    router.push(`/login/first-result?id=${encodeURIComponent(state.id)}`);
  }, [router, state]);

  return (
    <main className={styles.screen}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />

      <div className="relative mx-auto min-h-dvh w-full max-w-[1480px] px-5 pb-14 sm:px-8 lg:px-10">
        <header className="flex h-20 items-center justify-between border-b border-white/[0.07]">
          <Link href="/login" className="flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] border border-[#f1c96c]/25 bg-[#0b0e14] text-[13px] font-black tracking-[.08em] text-[#f1c96c] shadow-[0_0_30px_rgba(241,201,108,.08)]">
              БЗ
              <span className="absolute inset-x-1 bottom-1 h-px bg-[linear-gradient(90deg,transparent,#69e4ee,transparent)]" />
            </span>
            <span>
              <span className="block text-[14px] font-black tracking-[0.18em] text-[#fff8e7]">
                БИЗНЕС ЗАВОД
              </span>
              <span className="block text-[12px] uppercase tracking-[0.14em] text-white/60">
                OSA OPERATING SYSTEM
              </span>
            </span>
          </Link>

          <Link
            href="/login"
            className="rounded-[14px] border border-white/[0.11] bg-white/[0.035] px-4 py-2.5 text-sm font-bold text-white/76 transition hover:border-[#69e4ee]/25 hover:text-white"
          >
            ← Назад
          </Link>
        </header>

        <section className="grid min-h-[760px] items-center gap-8 py-8 xl:grid-cols-[.9fr_1.1fr] xl:gap-10">
          <div className="relative z-[2] max-w-[720px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#69e4ee]/18 bg-[#69e4ee]/[0.05] px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.12em] text-[#bff8fb]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#69e4ee] shadow-[0_0_12px_rgba(105,228,238,.8)]" />
              TEST DRIVE · БЕЗ РЕГИСТРАЦИИ
            </div>

            <p className="mt-6 text-[13px] font-black uppercase tracking-[0.18em] text-[#8ff1f7]">
              ПЕРВАЯ ЗАДАЧА ДЛЯ OSA
            </p>
            <h1 className="mt-4 max-w-[700px] text-[clamp(3rem,5.4vw,6rem)] font-black leading-[.9] tracking-[-0.065em] text-[#fff8e7]">
              Дайте задачу.
              <span className="block bg-[linear-gradient(180deg,#fff0ad_0%,#f4cf6a_38%,#d99a2d_82%)] bg-clip-text text-transparent">
                Получите результат.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/74">
              Не нужно разбираться в нейросетях и инструментах. Опишите, что хотите получить —
              Бизнес-Завод сам выберет нужный цех и соберёт первый рабочий вариант.
            </p>

            <form
              action={formAction}
              className="mt-7 overflow-hidden rounded-[28px] border border-[#69e4ee]/18 bg-[#080d14]/92 p-3.5 shadow-[0_30px_90px_-42px_rgba(0,0,0,.96),0_0_55px_-34px_rgba(105,228,238,.55)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between gap-3 px-2 pb-2">
                <span className="text-[12px] font-black uppercase tracking-[0.14em] text-white/76">
                  DIRECTOR CONSOLE
                </span>
                <span className="text-[12px] font-bold text-[#a9f4f8]">
                  OSA слушает
                </span>
              </div>

              <label htmlFor="first-request" className="sr-only">
                Что нужно сделать?
              </label>
              <textarea
                id="first-request"
                name="task"
                rows={6}
                required
                value={request}
                onChange={(event) => setRequest(event.target.value)}
                placeholder="Например: собери современный дорогой лендинг для сервиса управления недвижимостью…"
                className="min-h-[190px] w-full resize-none rounded-[20px] border border-white/[0.10] bg-black/30 px-5 py-5 text-lg leading-8 text-[#fff8e7] outline-none placeholder:text-white/42 focus:border-[#69e4ee]/34 focus:shadow-[0_0_36px_-24px_rgba(105,228,238,.7)]"
                autoFocus
              />

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2 px-1">
                  {['Сайт', 'Видео', 'Продажи', 'Анализ'].map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[12px] font-semibold text-white/64"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <SubmitButton disabled={!isTyping} />
              </div>
            </form>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {TASK_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setRequest(example)}
                  className="rounded-[16px] border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-left text-sm leading-6 text-white/68 transition hover:border-[#69e4ee]/20 hover:bg-[#69e4ee]/[0.035] hover:text-white"
                >
                  {example}
                </button>
              ))}
            </div>

            {state.status === 'invalid' ? (
              <p className="mt-3 text-sm font-semibold text-red-200/80">
                Сначала опишите задачу.
              </p>
            ) : null}
          </div>

          <div className="relative z-[1] mx-auto w-full max-w-[720px]">
            <BusinessFactoryHero
              active={isTyping}
              thinking={false}
              currentTask={request}
            />

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ['01', 'ЗАДАЧА', isTyping ? 'ПРИНЯТА' : 'ЖДЁМ'],
                ['02', 'OSA', 'ГОТОВА'],
                ['03', 'РЕЗУЛЬТАТ', isTyping ? 'NEXT' : 'WAIT'],
              ].map(([number, label, status], index) => (
                <div
                  key={label}
                  className="rounded-[18px] border border-white/[0.07] bg-[#070b11]/72 p-4 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-black tracking-[.13em] text-[#79eaf2]">
                      {number}
                    </span>
                    <span
                      className={
                        index === 1
                          ? 'text-[11px] font-black text-emerald-200/82'
                          : 'text-[11px] font-black text-[#f1c96c]/78'
                      }
                    >
                      {status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-black text-[#fff8e7]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
