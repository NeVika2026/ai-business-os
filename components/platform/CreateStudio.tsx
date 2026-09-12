'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  CREATE_STUDIO_MODES,
  buildCreateStudioPrompt,
  getCreateStudioMode,
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

    router.push(`/home?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(126,87,194,.23),transparent_38%),linear-gradient(135deg,#111827,#090b12)] p-6 text-white sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
          Бизнес Завод · Создать
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Студия создания
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-white/60">
          Опиши результат. OSA сначала соберёт концепцию и план, а затратную генерацию
          запустит только после твоего подтверждения.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Что создаём?</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CREATE_STUDIO_MODES.map((item) => {
              const active = item.id === modeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModeId(item.id)}
                  aria-pressed={active}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-0)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <span className="text-lg text-[var(--accent)]" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="mt-2 block text-sm font-semibold text-[var(--text-primary)]">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Что должно получиться?
              </span>
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows={5}
                placeholder={`Например: ${mode.description.toLowerCase()}`}
                className="resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Для кого?
              </span>
              <textarea
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                rows={3}
                placeholder="Например: владельцы квартир с ипотекой"
                className="resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Формат
                </span>
                <input
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                  placeholder="9:16, 20 сек."
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Дополнительный контекст
                </span>
                <input
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder="Что важно учесть"
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </label>
            </div>
          </div>
        </div>

        <aside className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            Как пойдёт работа
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
            {mode.label}
          </h2>

          <ol className="mt-5 grid gap-3">
            {[
              'OSA поймёт задачу и при необходимости задаст вопросы.',
              'Предложит концепцию, структуру и рабочий план.',
              'Ты сможешь исправить идею до генерации.',
              'После подтверждения подключатся нужные инструменты.',
              'Результат сохранится внутри проекта.',
            ].map((item, index) => (
              <li
                key={item}
                className="flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3 text-sm leading-6 text-[var(--text-secondary)]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>

          <button
            type="button"
            disabled={!canContinue}
            onClick={handoffToOsa}
            className="mt-6 w-full rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Передать AI-директору
          </button>

          <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">
            Провайдеры выбираются внутри платформы. На этом экране их выбирать не нужно.
          </p>
        </aside>
      </div>
    </section>
  );
}
