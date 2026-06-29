'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { executeOsaTaskRun, getOsaRunProgress, startOsaTask } from '@/app/(dashboard)/osa/actions';
import { OsaControlCenter } from '@/components/osa/osa-control-center';
import { OsaLiveProgress } from '@/components/osa/osa-live-progress';
import type { OsaHomeHandoffInput } from '@/utils/home/goal-handoff';
import {
  resolveOsaAgents,
  toOsaAgentDefinition,
  type OsaAgentDefinition,
  type OsaAgentId,
} from '@/utils/osa/agent-registry';
import {
  buildExecutionPlan,
  formatExecutionPlanEta,
  type ExecutionPlan,
} from '@/utils/osa/execution-planner';
import type { ExecutionProgress } from '@/utils/osa/execution-progress';
import { OSA_PROGRESS_POLL_INTERVAL_MS } from '@/utils/osa/osa-constants';
import type { OsaTaskSubmitResult } from '@/utils/osa/osa-task';
import {
  getOsaTeamRecommendation,
  OSA_ONBOARDING_EXAMPLES,
  type OsaTeamRecommendation,
} from '@/utils/osa/team-recommendation';

type FlowStep = 'onboarding' | 'loading' | 'team' | 'plan' | 'workspace';

const LOADING_DELAY_MS = 1600;

type OsaOnboardingFlowProps = {
  homeHandoff?: OsaHomeHandoffInput | null;
};

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `osa-session-${Date.now()}`;
}

function buildTeamFromHandoff(
  handoff: OsaHomeHandoffInput,
  fallbackInput: string,
): OsaTeamRecommendation {
  const fallback = getOsaTeamRecommendation(fallbackInput);

  if (handoff.recommendedTeamIds.length > 0) {
    const team = resolveOsaAgents(handoff.recommendedTeamIds as OsaAgentId[]).map(
      toOsaAgentDefinition,
    );

    if (team.length > 0) {
      return {
        team,
        recommendation: fallback.recommendation,
      };
    }
  }

  return fallback;
}

function HomePreparedBanner({ goalTitle }: { goalTitle: string }) {
  return (
    <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
      I&apos;ve already prepared your workspace for <strong>{goalTitle}</strong>.
    </div>
  );
}

export function OsaOnboardingFlow({ homeHandoff = null }: OsaOnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>(() => (homeHandoff ? 'loading' : 'onboarding'));
  const [userInput, setUserInput] = useState(() => homeHandoff?.starterPrompt ?? '');
  const [team, setTeam] = useState<OsaAgentDefinition[]>([]);
  const [teamRecommendation, setTeamRecommendation] = useState<OsaTeamRecommendation | null>(null);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [sessionId, setSessionId] = useState(() => homeHandoff?.sessionId ?? '');
  const [taskInput, setTaskInput] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskResult, setTaskResult] = useState<OsaTaskSubmitResult | null>(null);
  const [liveProgress, setLiveProgress] = useState<ExecutionProgress | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [projectPromptDismissed, setProjectPromptDismissed] = useState(false);

  useEffect(() => {
    if (step !== 'loading') {
      return;
    }

    const timer = window.setTimeout(() => {
      const recommendation = homeHandoff
        ? buildTeamFromHandoff(homeHandoff, userInput)
        : getOsaTeamRecommendation(userInput);
      setTeamRecommendation(recommendation);
      setTeam(recommendation.team);
      setStep('team');
    }, LOADING_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [step, userInput, homeHandoff]);

  function handleSubmitOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userInput.trim()) {
      return;
    }

    setTaskResult(null);
    setExecutionPlan(null);
    setStep('loading');
  }

  function handleLaunchTeam() {
    setSessionId(homeHandoff?.sessionId || createSessionId());
    setExecutionPlan(
      buildExecutionPlan({
        userInput: userInput.trim(),
        team,
        recommendation: teamRecommendation?.recommendation,
      }),
    );
    setStep('plan');
  }

  function handleEnterWorkspace() {
    setStep('workspace');
  }

  async function handleSubmitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskInput.trim() || taskLoading) {
      return;
    }

    setTaskLoading(true);
    setTaskResult(null);
    setLiveProgress(null);
    setActiveRunId(null);

    let pollTimer: number | undefined;

    try {
      const started = await startOsaTask({
        userPrompt: taskInput.trim(),
        selectedAgents: team.map((agent) => ({ id: agent.id, name: agent.name })),
        businessDescription: userInput.trim(),
        sessionId: sessionId || createSessionId(),
        executionPlan,
      });

      if (started.status === 'failed') {
        setTaskResult({
          status: 'failed',
          message: started.message,
          resultText: null,
          agentTrace: [],
          runtimeReport: null,
        });
        return;
      }

      setActiveRunId(started.runId);

      pollTimer = window.setInterval(async () => {
        const progress = await getOsaRunProgress(started.runId);
        if (progress) {
          setLiveProgress(progress);
        }
      }, OSA_PROGRESS_POLL_INTERVAL_MS);

      const result = await executeOsaTaskRun(started.runId);
      const finalProgress = await getOsaRunProgress(started.runId);

      setTaskResult(result);
      if (finalProgress) {
        setLiveProgress(finalProgress);
      }

      if (result.status !== 'failed') {
        setTaskInput('');
        router.refresh();
      }
    } catch {
      setTaskResult({
        status: 'failed',
        message: 'Не удалось отправить задачу. Попробуйте ещё раз.',
        resultText: null,
        agentTrace: [],
        runtimeReport: null,
      });
    } finally {
      if (pollTimer !== undefined) {
        window.clearInterval(pollTimer);
      }
      setTaskLoading(false);
    }
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
        {homeHandoff ? (
          <div className="w-full max-w-xl">
            <HomePreparedBanner goalTitle={homeHandoff.goalTitle} />
          </div>
        ) : null}
        <div
          aria-hidden="true"
          className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent)]"
        />
        <p className="text-lg font-medium text-[var(--text-primary)]">Анализирую ваш бизнес...</p>
      </section>
    );
  }

  if (step === 'plan' && executionPlan) {
    return (
      <section className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
            Execution Plan
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            План выполнения задачи
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Общий ETA: {formatExecutionPlanEta(executionPlan.estimatedMinutes)}
            {executionPlan.reviewRequired ? ' · Review required' : ''}
          </p>
        </header>

        <div className="space-y-4">
          {executionPlan.stages.map((stage, index) => (
            <article
              key={stage.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
                    Stage {index + 1}
                  </p>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {stage.title}
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                  {stage.estimatedMinutes} мин
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{stage.description}</p>
              <p className="mt-3 text-sm text-[var(--text-primary)]">
                Агенты: {stage.assignedAgents.map((agent) => agent.name).join(', ')}
              </p>
              {stage.parallel ? (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">Параллельное выполнение</p>
              ) : null}
            </article>
          ))}
        </div>

        {executionPlan.risks.length > 0 ? (
          <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Risk Detection</h2>
            <ul className="space-y-2">
              {executionPlan.risks.map((risk) => (
                <li key={risk.id} className="text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">
                    [{risk.severity}] {risk.title}:
                  </span>{' '}
                  {risk.description} — {risk.mitigation}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleEnterWorkspace}
          className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Перейти в Workspace
        </button>
      </section>
    );
  }

  if (step === 'team') {
    const resumeHref =
      homeHandoff?.resumeRunHref ??
      (homeHandoff?.resumeRunId ? `/orchestrator/runs/${homeHandoff.resumeRunId}` : null);

    return (
      <section className="mx-auto w-full max-w-3xl space-y-6">
        {homeHandoff ? <HomePreparedBanner goalTitle={homeHandoff.goalTitle} /> : null}

        {homeHandoff?.needsProject && !projectPromptDismissed ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create a project?</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Projects connect OSA, documents, CRM, and knowledge. Recommended type:{' '}
              {homeHandoff.recommendedProjectType}.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/projects?project_type=${homeHandoff.recommendedProjectType}`}
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
              >
                Create project
              </Link>
              <button
                type="button"
                onClick={() => setProjectPromptDismissed(true)}
                className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm"
              >
                Skip
              </button>
            </div>
          </div>
        ) : null}

        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            Для вас я собрал команду
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{userInput}</p>
          {teamRecommendation ? (
            <div className="mx-auto max-w-2xl space-y-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-left text-sm">
              <p className="text-[var(--text-primary)]">
                Confidence: {teamRecommendation.recommendation.confidence}%
                {teamRecommendation.recommendation.needsNavigatorReview
                  ? ' · Navigator review recommended'
                  : ''}
              </p>
              <p className="text-[var(--text-secondary)]">
                Primary: {teamRecommendation.recommendation.primaryTeam.join(', ')}
                {teamRecommendation.recommendation.secondaryTeam.length > 0
                  ? ` · Secondary: ${teamRecommendation.recommendation.secondaryTeam.join(', ')}`
                  : ''}
              </p>
              {teamRecommendation.recommendation.tags.length > 0 ? (
                <p className="text-xs text-[var(--text-secondary)]">
                  Tags: {teamRecommendation.recommendation.tags.join(', ')}
                </p>
              ) : null}
            </div>
          ) : null}
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

        {resumeHref ? (
          <Link
            href={resumeHref}
            className="flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Resume: {homeHandoff?.resumeRunLabel ?? 'Continue execution'}
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleLaunchTeam}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Запустить команду
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
          OSA Workspace
        </h1>
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
              <span
                className="inline-flex h-2 w-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{agent.workspaceStatus}</p>
          </article>
        ))}
      </div>

      <OsaControlCenter
        runId={activeRunId}
        progress={liveProgress}
        loading={taskLoading}
        onProgressChange={setLiveProgress}
        onExecutionComplete={() => {
          router.refresh();
        }}
      />

      <OsaLiveProgress progress={liveProgress} loading={taskLoading} />

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
        <form onSubmit={handleSubmitTask} className="space-y-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Что поручить команде?
            </span>
            <input
              value={taskInput}
              onChange={(event) => setTaskInput(event.target.value)}
              placeholder="Например: подготовь план привлечения клиентов на неделю"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>
          <button
            type="submit"
            disabled={!taskInput.trim() || taskLoading}
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {taskLoading ? 'Отправляю задачу...' : 'Отправить задачу'}
          </button>
        </form>

        {taskResult ? (
          <div
            className={`mt-4 space-y-3 rounded-xl px-4 py-3 text-sm ${
              taskResult.status === 'failed'
                ? 'border border-red-500/30 bg-red-500/10 text-[var(--text-primary)]'
                : 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
            }`}
          >
            <p className="font-medium">{taskResult.message}</p>

            {taskResult.agentTrace.length > 0 ? (
              <p className="text-[var(--text-secondary)]">{taskResult.agentTrace.join(' → ')}</p>
            ) : null}

            {taskResult.resultText ? <p>{taskResult.resultText}</p> : null}

            {taskResult.runtimeReport ? (
              <p className="text-xs text-[var(--text-secondary)]">
                Runtime: {taskResult.runtimeReport.gatewayCallCount} gateway ·{' '}
                {taskResult.runtimeReport.toolCallCount} tools ·{' '}
                {taskResult.runtimeReport.durationMs ?? 0} ms
                {activeRunId ? ` · Run ${activeRunId}` : ''}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
