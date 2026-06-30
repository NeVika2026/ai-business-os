'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';

import { generateFirstPlan } from '@/app/login/actions';
import { ThinkingScene } from '@/components/runtime/ThinkingScene';

const QUICK_PROMPTS = [
  { label: 'Стратегия', value: 'Подготовить стратегию роста на ближайший квартал' },
  { label: 'Контент', value: 'Составить контент-план на месяц для соцсетей' },
  { label: 'Анализ бизнеса', value: 'Проанализировать текущую ситуацию в бизнесе и предложить приоритеты' },
] as const;

type IntroFormContentProps = {
  request: string;
  setRequest: (value: string) => void;
};

function IntroFormContent({ request, setRequest }: IntroFormContentProps) {
  const { pending } = useFormStatus();

  if (pending) {
    return <ThinkingScene />;
  }

  return (
    <div className="wow-fade-in mx-auto w-full max-w-lg">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Какую задачу решаем?
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
          Опишите, что хотите получить. Система подготовит первый черновик без регистрации.
        </p>
      </div>

      <div className="mt-10 space-y-6">
        <div>
          <label htmlFor="first-request" className="sr-only">
            Описание задачи
          </label>
          <textarea
            id="first-request"
            name="task"
            rows={4}
            required
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            placeholder="Например: подготовить план поиска клиентов на новостройки"
            className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => setRequest(prompt.value)}
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-2 text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {prompt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={!request.trim()}
            className="inline-flex rounded-xl bg-[var(--accent)] px-8 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Получить первый результат
          </button>

          <p className="max-w-sm text-center text-xs leading-relaxed text-[var(--text-secondary)]">
            Аккаунт понадобится только для сохранения результата и продолжения работы.
          </p>
        </div>
      </div>

      <p className="mt-10 text-center">
        <Link
          href="/login"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Назад
        </Link>
      </p>
    </div>
  );
}

export function FirstRequestScreen() {
  const [request, setRequest] = useState('');

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-[var(--surface-0)] px-6 py-20 sm:py-28">
      <form action={generateFirstPlan} className="w-full">
        <IntroFormContent request={request} setRequest={setRequest} />
      </form>
    </main>
  );
}
