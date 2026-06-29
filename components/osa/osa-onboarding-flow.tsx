'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { consumeHomeHandoff } from '@/app/(dashboard)/home/actions';
import { executeOsaTaskRun, getOsaRunProgress, startOsaTask } from '@/app/(dashboard)/osa/actions';
import type { OsaHomeHandoffInput } from '@/utils/home/goal-handoff';
import {
  resolveOsaAgents,
  toOsaAgentDefinition,
  type OsaAgentDefinition,
  type OsaAgentId,
} from '@/utils/osa/agent-registry';
import { buildExecutionPlan, type ExecutionPlan } from '@/utils/osa/execution-planner';
import type { ExecutionProgress } from '@/utils/osa/execution-progress';
import { OSA_PROGRESS_POLL_INTERVAL_MS } from '@/utils/osa/osa-constants';
import type { OsaTaskSubmitResult } from '@/utils/osa/osa-task';
import { getOsaTeamRecommendation, type OsaTeamRecommendation } from '@/utils/osa/team-recommendation';

type FlowStep = 'loading' | 'prepared' | 'working';

const PREPARATION_MESSAGES = [
  'Understanding your goal...',
  'Finding the best approach...',
  'Preparing your workspace...',
  'Almost ready...',
] as const;

const MESSAGE_INTERVAL_MS = 800;

type InvisibleWorkspaceFlowProps = {
  homeHandoff?: OsaHomeHandoffInput | null;
  handoffId?: string | null;
  handoffError?: 'expired' | 'invalid' | 'consumed' | null;
};

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}`;
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

function buildPreparedSummary(goalTitle: string, plan: ExecutionPlan | null): string {
  if (plan && plan.stages.length > 0) {
    const stageTitles = plan.stages
      .slice(0, 3)
      .map((stage) => stage.title)
      .join(', ');

    return `Your workspace for "${goalTitle}" is set up with a clear path: ${stageTitles}.`;
  }

  return `Your workspace for "${goalTitle}" is ready. We'll start with your top priority.`;
}

export function InvisibleWorkspaceFlow({
  homeHandoff = null,
  handoffId = null,
  handoffError = null,
}: InvisibleWorkspaceFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>('loading');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [userInput] = useState(() => homeHandoff?.starterPrompt ?? '');
  const [team, setTeam] = useState<OsaAgentDefinition[]>([]);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [sessionId, setSessionId] = useState(() => homeHandoff?.sessionId ?? '');
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskResult, setTaskResult] = useState<OsaTaskSubmitResult | null>(null);
  const [liveProgress, setLiveProgress] = useState<ExecutionProgress | null>(null);

  const goalTitle = homeHandoff?.goalTitle ?? 'Your goal';
  const suggestedAction = homeHandoff?.starterPrompt ?? userInput;

  useEffect(() => {
    if (step !== 'loading') {
      return;
    }

    const messageTimer = window.setInterval(() => {
      setLoadingMessageIndex((current) =>
        Math.min(current + 1, PREPARATION_MESSAGES.length - 1),
      );
    }, MESSAGE_INTERVAL_MS);

    const completeTimer = window.setTimeout(() => {
      const recommendation = homeHandoff
        ? buildTeamFromHandoff(homeHandoff, userInput)
        : getOsaTeamRecommendation(userInput);
      const resolvedTeam = recommendation.team;
      const resolvedSessionId = homeHandoff?.sessionId || createSessionId();

      setTeam(resolvedTeam);
      setSessionId(resolvedSessionId);
      setExecutionPlan(
        buildExecutionPlan({
          userInput: userInput.trim(),
          team: resolvedTeam,
          recommendation: recommendation.recommendation,
        }),
      );
      if (handoffId) {
        void consumeHomeHandoff(handoffId);
      }

      setStep('prepared');
    }, PREPARATION_MESSAGES.length * MESSAGE_INTERVAL_MS);

    return () => {
      window.clearInterval(messageTimer);
      window.clearTimeout(completeTimer);
    };
  }, [step, userInput, homeHandoff, handoffId]);

  async function runTask(prompt: string) {
    if (!prompt.trim() || taskLoading) {
      return;
    }

    setStep('working');
    setTaskLoading(true);
    setTaskResult(null);
    setLiveProgress(null);

    let pollTimer: number | undefined;

    try {
      const started = await startOsaTask({
        userPrompt: prompt.trim(),
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
        router.refresh();
      }
    } catch {
      setTaskResult({
        status: 'failed',
        message: 'Something went wrong. Please try again.',
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

  if (handoffError) {
    return (
      <section className="mx-auto w-full max-w-xl space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 text-center">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">This session has expired</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Pick a goal on Today to start fresh.
        </p>
        <Link
          href="/home"
          className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          Back to Today
        </Link>
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
        <p className="text-lg font-medium text-[var(--text-primary)]" role="status">
          {PREPARATION_MESSAGES[loadingMessageIndex]}
        </p>
      </section>
    );
  }

  if (step === 'prepared' && !taskResult) {
    const summary = buildPreparedSummary(goalTitle, executionPlan);

    return (
      <section className="mx-auto w-full max-w-2xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
            Here&apos;s what I&apos;ve prepared
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{summary}</p>
        </header>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            Suggested next step
          </p>
          <p className="mt-2 text-sm text-[var(--text-primary)]">{suggestedAction}</p>
        </div>

        <button
          type="button"
          onClick={() => void runTask(suggestedAction)}
          className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Get started
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
          {taskResult?.status === 'failed' ? 'Something went wrong' : 'Your result'}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {taskLoading
            ? 'Working on it...'
            : taskResult?.status === 'failed'
              ? 'We could not finish this request.'
              : 'Here is what was prepared for you.'}
        </p>
      </header>

      {taskLoading ? (
        <div
          role="status"
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-5 py-4 text-sm text-[var(--text-primary)]"
        >
          {liveProgress?.currentTask
            ? `Working on: ${liveProgress.currentTask}`
            : 'Working on your request...'}
        </div>
      ) : null}

      {taskResult ? (
        <div
          className={`space-y-4 rounded-2xl border px-5 py-4 text-sm ${
            taskResult.status === 'failed'
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-[var(--border-subtle)] bg-[var(--surface-1)]'
          }`}
        >
          <p className="font-medium text-[var(--text-primary)]">{taskResult.message}</p>
          {taskResult.resultText ? (
            <p className="whitespace-pre-wrap text-[var(--text-primary)]">{taskResult.resultText}</p>
          ) : null}
        </div>
      ) : null}

      {!taskLoading && taskResult?.status !== 'failed' && taskResult?.resultText ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/projects"
            className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
          >
            Save to project
          </Link>
          <Link
            href="/home"
            className="inline-flex rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)]"
          >
            Back to Today
          </Link>
        </div>
      ) : null}

      {!taskLoading && taskResult?.status === 'failed' ? (
        <button
          type="button"
          onClick={() => {
            setTaskResult(null);
            setStep('prepared');
          }}
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
        >
          Try again
        </button>
      ) : null}
    </section>
  );
}

export const OsaOnboardingFlow = InvisibleWorkspaceFlow;
