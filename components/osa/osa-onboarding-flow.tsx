'use client';

import { useEffect, useState } from 'react';

import {
  OSA_ONBOARDING_EXAMPLES,
  recommendOsaTeam,
  type OsaAgentDefinition,
} from '@/utils/osa/team-recommendation';

type FlowStep = 'onboarding' | 'loading' | 'team' | 'workspace';

const LOADING_DELAY_MS = 1600;

export function OsaOnboardingFlow() {
  const [step, setStep] = useState<FlowStep>('onboarding');
  const [userInput, setUserInput] = useState('');
  const [team, setTeam] = useState<OsaAgentDefinition[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [taskMessage, setTaskMessage] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 'loading') {
      return;
    }

    const timer = window.setTimeout(() => {
      setTeam(recommendOsaTeam(userInput));
      setStep('team');
    }, LOADING_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [step, userInput]);

  function handleSubmitOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userInput.trim()) {
      return;
    }

    setTaskMessage(null);
    setStep('loading');
  }

  function handleLaunchTeam() {
    setStep('workspace');
  }

  function handleSubmitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskInput.trim()) {
      return;
    }

    setTaskMessage(`Задача принята: «${taskInput.trim()}». Команда начнёт работу в ближайшее время.`);
    setTaskInput('');
  }

  if (step === 'onboarding') {
    return (
      <section className="mx-auto w-full max-w-2xl space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">OSA</p>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">
            Добро пожаловать в OSA
          </h1>
          <p className="text-base text-[var(--text-secondary)] sm:text-lg">
            Я соберу для вас команду AI-сотрудников.
          </p>
        </header>

        <form onSubmit={handleSubmitOnboarding} className="space-y-4">
          <label className="block space-y-2">
            <span className="sr-only">Опишите ваш бизнес и задачу</span>
            <textarea
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              rows={5}
              placeholder="Расскажите, чем вы занимаетесь и какую задачу хотите решить"
              className="w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <button
            type="submit"
            disabled={!userInput.trim()}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Собрать команду
          </button>
        </form>

        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">Примеры:</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {OSA_ONBOARDING_EXAMPLES.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => setUserInput(example)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  if (step === 'loading') {
    return (
      <section className="mx-auto flex min-h-[320px] w-full max-w-xl flex-col items-center justify-center space-y-4 text-center">
        <div
          aria-hidden="true"
          className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent)]"
        />
        <p className="text-lg font-medium text-[var(--text-primary)]">Анализирую ваш бизнес...</p>
      </section>
    );
  }

  if (step === 'team') {
    return (
      <section className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            Для вас я собрал команду
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{userInput}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {team.map((agent) => (
            <article
              key={agent.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5"
            >
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{agent.name}</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{agent.description}</p>
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLaunchTeam}
          className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Запустить команду
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">OSA Workspace</h1>
        <p className="text-sm text-[var(--text-secondary)]">Ваша команда AI-сотрудников активна</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((agent) => (
          <article
            key={agent.id}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">{agent.name}</h2>
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{agent.workspaceStatus}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
        <form onSubmit={handleSubmitTask} className="space-y-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Что поручить команде?</span>
            <input
              value={taskInput}
              onChange={(event) => setTaskInput(event.target.value)}
              placeholder="Например: подготовь план привлечения клиентов на неделю"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>
          <button
            type="submit"
            disabled={!taskInput.trim()}
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Отправить задачу
          </button>
        </form>

        {taskMessage ? (
          <p className="mt-4 rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--text-primary)]">
            {taskMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
