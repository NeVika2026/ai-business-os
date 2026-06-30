'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { submitWorkspacePrompt } from '@/app/(dashboard)/workspace/[projectId]/actions';
import { OrbitMark } from '@/components/brand/OrbitMark';
import { NextBestStep } from '@/components/navigator/NextBestStep';
import type { NavigatorStep, NavigatorStepId } from '@/types/navigator';
import type { OsaWorkspacePageData } from '@/utils/workspace/workspace-types';

type ConversationMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type OsaProjectWorkspaceProps = {
  data: OsaWorkspacePageData;
};

function formatActivity(value: string | null): string {
  if (!value) {
    return 'Пока без активности';
  }

  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function navigatorPrompt(stepId: NavigatorStepId, projectTitle: string): string {
  switch (stepId) {
    case 'quick_result':
      return `Помоги быстро получить результат в проекте «${projectTitle}».`;
    case 'build_system':
      return `Разложи проект «${projectTitle}» на этапы и собери рабочий план.`;
    case 'scale':
      return `Подготовь проект «${projectTitle}» к масштабированию.`;
    default:
      return `Продолжи работу над проектом «${projectTitle}».`;
  }
}

export function OsaProjectWorkspace({ data }: OsaProjectWorkspaceProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(data.today.nextStep);
  const [messages, setMessages] = useState<ConversationMessage[]>(() => {
    if (data.today.lastResult) {
      return [
        {
          id: 'seed-assistant',
          role: 'assistant',
          content: data.today.lastResult,
        },
      ];
    }

    return [];
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const timeline = useMemo(() => data.timeline, [data.timeline]);

  const handleSubmit = (value?: string) => {
    const nextPrompt = (value ?? prompt).trim();

    if (!nextPrompt || isPending) {
      return;
    }

    setError(null);
    setPrompt('');
    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: nextPrompt,
    };

    setMessages((current) => [...current, userMessage]);

    startTransition(async () => {
      const result = await submitWorkspacePrompt(data.projectId, nextPrompt);

      if (result.status === 'failed') {
        setError(result.message);
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.content,
        },
      ]);
      router.refresh();
    });
  };

  const handleNavigatorSelect = (step: NavigatorStep) => {
    const nextPrompt = navigatorPrompt(step.id, data.header.title);
    setPrompt(nextPrompt);
    handleSubmit(nextPrompt);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex justify-center">
        <OrbitMark size="md" breathe />
      </div>

      <header className="mt-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              {data.header.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              {data.header.description}
            </p>
          </div>
          <div className="text-right text-sm text-[var(--text-secondary)]">
            <p>
              Статус: <span className="text-[var(--text-primary)]">{data.header.status}</span>
            </p>
            <p className="mt-1">
              Последняя активность:{' '}
              <span className="text-[var(--text-primary)]">
                {formatActivity(data.header.lastActivity)}
              </span>
            </p>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] xl:gap-10">
        <div className="space-y-8">
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Today
            </p>
            <h2 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
              {data.today.headline}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Миссия дня</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{data.today.mission}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Следующий лучший шаг</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{data.today.nextStep}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Приоритет дня</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{data.today.priority}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-[var(--text-tertiary)]">
              Прогресс: {data.today.progressPercent}%
            </p>
          </section>

          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Conversation
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Рабочий диалог проекта. OSA учитывает Executive Brain, память и контекст проекта.
            </p>

            <div className="mt-6 space-y-4">
              {messages.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Опишите задачу — OSA продолжит работу в контексте проекта.
                </p>
              ) : null}

              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`rounded-xl border px-4 py-3 ${
                    message.role === 'user'
                      ? 'border-[var(--border-subtle)] bg-[var(--surface-1)]'
                      : 'border-[var(--accent)]/20 bg-[var(--accent-soft)]'
                  }`}
                >
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                    {message.role === 'user' ? 'Вы' : 'OSA'}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                    {message.content}
                  </p>
                </article>
              ))}

              {isPending ? (
                <p className="text-sm text-[var(--text-secondary)]" role="status" aria-live="polite">
                  OSA думает над ответом…
                </p>
              ) : null}
            </div>

            <form
              className="mt-6 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
            >
              <label className="block text-sm font-medium text-[var(--text-primary)]" htmlFor="workspace-prompt">
                Ваша задача
              </label>
              <textarea
                id="workspace-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                disabled={isPending}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                placeholder="Что нужно сделать в этом проекте сейчас?"
              />
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <button
                type="submit"
                disabled={isPending || !prompt.trim()}
                className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? 'OSA работает…' : 'Отправить в OSA'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Timeline
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              История решений проекта из Memory Engine.
            </p>

            {timeline.length === 0 ? (
              <p className="mt-6 text-sm text-[var(--text-secondary)]">
                Пока нет зафиксированных решений. Первый ответ OSA появится здесь.
              </p>
            ) : (
              <ol className="mt-6 space-y-4">
                {timeline.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{entry.task}</p>
                      <time className="text-xs text-[var(--text-tertiary)]">
                        {formatActivity(entry.occurredAt)}
                      </time>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{entry.result}</p>
                    <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                      Решение: {entry.decision}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="xl:pt-1">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Navigator
            </p>
            <NextBestStep
              compact
              title={data.navigator.title}
              subtitle={data.navigator.subtitle}
              steps={data.navigator.steps}
              onSelect={handleNavigatorSelect}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
