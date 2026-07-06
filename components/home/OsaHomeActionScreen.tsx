'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { submitHomeTask } from '@/app/(dashboard)/home/actions';
import { OrbitMark } from '@/components/brand/OrbitMark';
import { HomeProcessSteps } from '@/components/home/HomeProcessSteps';
import { OsaErrorState } from '@/components/osa/OsaErrorState';
import {
  HOME_ACTION_PLACEHOLDER,
  HOME_PROCESS_STEPS,
  HOME_QUICK_ACTIONS,
  type HomeQuickActionId,
} from '@/utils/home/home-action';

type OsaHomeActionScreenProps = {
  organizationName: string;
};

type ScreenPhase = 'input' | 'processing' | 'result' | 'error';

const STEP_INTERVAL_MS = 700;

export function OsaHomeActionScreen({ organizationName }: OsaHomeActionScreenProps) {
  const [prompt, setPrompt] = useState('');
  const [phase, setPhase] = useState<ScreenPhase>('input');
  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const [resultContent, setResultContent] = useState<string | null>(null);
  const [workspaceHref, setWorkspaceHref] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; hint: string } | null>(null);
  const [lastQuickActionId, setLastQuickActionId] = useState<HomeQuickActionId | undefined>();
  const [isPending, startTransition] = useTransition();

  const runTask = (quickActionId?: HomeQuickActionId) => {
    const trimmed = prompt.trim();

    if (!trimmed && !quickActionId) {
      return;
    }

    setError(null);
    setResultContent(null);
    setWorkspaceHref(null);
    setVisibleStepCount(1);
    setPhase('processing');
    setLastQuickActionId(quickActionId);

    const stepTimers = HOME_PROCESS_STEPS.map((_, index) =>
      window.setTimeout(() => setVisibleStepCount(index + 1), STEP_INTERVAL_MS * (index + 1)),
    );

    startTransition(async () => {
      const result = await submitHomeTask(trimmed, quickActionId);

      for (const timer of stepTimers) {
        window.clearTimeout(timer);
      }

      setVisibleStepCount(4);

      if (result.status === 'failed') {
        setError({ message: result.message, hint: result.hint });
        setPhase('error');
        return;
      }

      setResultContent(result.content);
      setWorkspaceHref(`/workspace/${result.projectId}`);
      setPhase('result');
    });
  };

  const resetToInput = () => {
    setPhase('input');
    setVisibleStepCount(0);
    setError(null);
  };

  const busy = isPending || phase === 'processing';

  return (
    <div className="osa-home-action mx-auto w-full max-w-[720px] px-2 pb-24 pt-10 sm:px-4 sm:pt-16">
      <header className="mb-14 space-y-4">
        <div className="flex items-center gap-3">
          <OrbitMark size="sm" className="text-[var(--accent)]" />
          <p className="text-[13px] text-[var(--text-secondary)]">{organizationName}</p>
        </div>
        <h1 className="text-[clamp(2rem,5vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.03em] text-[var(--text-primary)]">
          OSA
        </h1>
      </header>

      {phase === 'input' || phase === 'error' ? (
        <section className="space-y-8">
          <label className="block space-y-4">
            <span className="sr-only">{HOME_ACTION_PLACEHOLDER}</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              disabled={busy}
              placeholder={HOME_ACTION_PLACEHOLDER}
              className="w-full resize-none rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 py-5 text-[clamp(1.125rem,2.2vw,1.35rem)] leading-relaxed text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            {HOME_QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={busy}
                onClick={() => runTask(action.id)}
                className="rounded-full border border-[var(--border-subtle)] px-5 py-2.5 text-[14px] font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={busy || !prompt.trim()}
            onClick={() => runTask()}
            className="inline-flex rounded-full bg-[var(--accent)] px-7 py-3.5 text-[15px] font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Отправить
          </button>

          {phase === 'error' && error ? (
            <OsaErrorState
              message={error.message}
              hint={error.hint}
              onRetry={() => runTask(lastQuickActionId)}
            />
          ) : null}
        </section>
      ) : null}

      {phase === 'processing' ? (
        <section className="space-y-10" aria-busy="true" aria-live="polite">
          <div className="osa-orbit-presence flex justify-start">
            <OrbitMark size="md" breathe className="text-[var(--accent)]" />
          </div>
          <HomeProcessSteps visibleStepCount={visibleStepCount} />
        </section>
      ) : null}

      {phase === 'result' && resultContent ? (
        <section className="space-y-8">
          <HomeProcessSteps visibleStepCount={4} />
          <div className="space-y-4 border-t border-[var(--border-subtle)]/60 pt-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Первый результат
            </p>
            <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-[var(--text-primary)]">
              {resultContent}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            {workspaceHref ? (
              <Link
                href={workspaceHref}
                className="text-[15px] font-medium text-[var(--accent)] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                Открыть Workspace →
              </Link>
            ) : null}
            <button
              type="button"
              onClick={resetToInput}
              className="text-[15px] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              Новая задача
            </button>
          </div>
        </section>
      ) : null}

      <footer className="mt-20 border-t border-[var(--border-subtle)]/60 pt-8">
        <Link
          href="/home/mission-control"
          className="text-[14px] text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Mission Control →
        </Link>
      </footer>
    </div>
  );
}
