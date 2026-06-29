'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { consumeHomeHandoff } from '@/app/(dashboard)/home/actions';
import { executeOsaTaskRun, startOsaTask } from '@/app/(dashboard)/osa/actions';
import { WowMoment } from '@/components/home/WowMoment';
import { IntentClarificationQuestion } from '@/components/intent/IntentClarificationQuestion';
import { IntentConfirmationScreen } from '@/components/intent/IntentConfirmationScreen';
import { isHomeGoalId, type OsaHomeHandoffInput } from '@/utils/home/goal-handoff';
import type { HomeGoalId } from '@/utils/home/home-types';
import { buildMeaningfulLoading, buildWowMoment } from '@/utils/home/wow-engine';
import {
  applyClarificationToPrompt,
  buildIntentConfirmation,
  type IntentConfirmationData,
} from '@/utils/intent/intent-confirmation';
import {
  resolveOsaAgents,
  toOsaAgentDefinition,
  type OsaAgentDefinition,
  type OsaAgentId,
} from '@/utils/osa/agent-registry';
import { buildExecutionPlan, type ExecutionPlan } from '@/utils/osa/execution-planner';
import { getOsaTeamRecommendation } from '@/utils/osa/team-recommendation';

import { USER_FACING_EXECUTION_STATUS } from '@/lib/ai/router-messages';

type FlowStep = 'wow' | 'clarify' | 'confirm' | 'working' | 'failed';

const WORK_PROGRESS_MESSAGES = [
  USER_FACING_EXECUTION_STATUS.working,
  USER_FACING_EXECUTION_STATUS.preparing,
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

function resolveGoalId(handoff: OsaHomeHandoffInput | null): HomeGoalId {
  if (handoff?.goalId && isHomeGoalId(handoff.goalId)) {
    return handoff.goalId;
  }

  return 'dont_know';
}

function buildTeamFromHandoff(handoff: OsaHomeHandoffInput, prompt: string) {
  const fallback = getOsaTeamRecommendation(prompt);

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

export function InvisibleWorkspaceFlow({
  homeHandoff = null,
  handoffId = null,
  handoffError = null,
}: InvisibleWorkspaceFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>('wow');
  const [workMessageIndex, setWorkMessageIndex] = useState(0);
  const [starterPrompt, setStarterPrompt] = useState(() => homeHandoff?.starterPrompt ?? '');
  const [team, setTeam] = useState<OsaAgentDefinition[]>([]);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [sessionId, setSessionId] = useState(() => homeHandoff?.sessionId ?? '');
  const [intent, setIntent] = useState<IntentConfirmationData | null>(null);
  const [clarificationAnswerId, setClarificationAnswerId] = useState<string | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);

  const goalId = useMemo(() => resolveGoalId(homeHandoff), [homeHandoff]);

  const wowLoading = useMemo(
    () =>
      buildMeaningfulLoading({
        projectCount: homeHandoff?.wowContext?.projectCount ?? 0,
        hasPreviousWork: Boolean(homeHandoff?.wowContext?.lastCompletedResultLabel),
        goalTitle: homeHandoff?.goalTitle ?? 'Your goal',
      }),
    [homeHandoff],
  );

  const wowMoment = useMemo(
    () =>
      buildWowMoment({
        userName: homeHandoff?.wowContext?.userName ?? 'there',
        goalTitle: homeHandoff?.goalTitle ?? 'Your goal',
        projectCount: homeHandoff?.wowContext?.projectCount ?? 0,
        activeProjectName: homeHandoff?.activeProjectName ?? null,
      }),
    [homeHandoff],
  );

  const advanceFromWow = useCallback(() => {
    if (!homeHandoff) {
      return;
    }

    const recommendation = buildTeamFromHandoff(homeHandoff, starterPrompt);
    const resolvedTeam = recommendation.team;
    const resolvedSessionId = homeHandoff.sessionId || createSessionId();
    const plan = buildExecutionPlan({
      userInput: starterPrompt.trim(),
      team: resolvedTeam,
      recommendation: recommendation.recommendation,
    });
    const nextIntent = buildIntentConfirmation({
      goalId,
      starterPrompt,
      executionPlan: plan,
      recommendation: recommendation.recommendation,
      clarificationAnswerId,
    });

    setTeam(resolvedTeam);
    setSessionId(resolvedSessionId);
    setExecutionPlan(plan);
    setIntent(nextIntent);
    setStep(nextIntent.needsClarification && nextIntent.clarification ? 'clarify' : 'confirm');
  }, [clarificationAnswerId, goalId, homeHandoff, starterPrompt]);

  useEffect(() => {
    if (step !== 'working' || !taskLoading) {
      return;
    }

    const timer = window.setInterval(() => {
      setWorkMessageIndex((current) => Math.min(current + 1, WORK_PROGRESS_MESSAGES.length - 1));
    }, MESSAGE_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [step, taskLoading]);

  function rebuildAfterClarification(optionId: string) {
    const updatedPrompt = applyClarificationToPrompt(goalId, starterPrompt, optionId);
    const recommendation = homeHandoff
      ? buildTeamFromHandoff(homeHandoff, updatedPrompt)
      : getOsaTeamRecommendation(updatedPrompt);
    const plan = buildExecutionPlan({
      userInput: updatedPrompt.trim(),
      team: recommendation.team,
      recommendation: recommendation.recommendation,
    });

    setStarterPrompt(updatedPrompt);
    setClarificationAnswerId(optionId);
    setTeam(recommendation.team);
    setExecutionPlan(plan);
    setIntent(
      buildIntentConfirmation({
        goalId,
        starterPrompt: updatedPrompt,
        executionPlan: plan,
        recommendation: recommendation.recommendation,
        clarificationAnswerId: optionId,
      }),
    );
    setStep('confirm');
  }

  async function runTask(prompt: string) {
    if (!prompt.trim() || taskLoading) {
      return;
    }

    setStep('working');
    setTaskLoading(true);
    setFailureMessage(null);
    setWorkMessageIndex(0);

    if (handoffId) {
      void consumeHomeHandoff(handoffId);
    }

    try {
      const started = await startOsaTask({
        userPrompt: prompt.trim(),
        selectedAgents: team.map((agent) => ({ id: agent.id, name: agent.name })),
        businessDescription: prompt.trim(),
        sessionId: sessionId || createSessionId(),
        executionPlan,
        goalId: homeHandoff?.goalId ?? null,
        goalTitle: homeHandoff?.goalTitle ?? null,
      });

      if (started.status === 'failed') {
        setFailureMessage(started.message);
        setStep('failed');
        return;
      }

      const result = await executeOsaTaskRun(started.runId);

      if (result.status === 'failed') {
        setFailureMessage(result.message);
        setStep('failed');
        return;
      }

      router.push(`/results/${started.runId}`);
    } catch {
      setFailureMessage('Something went wrong. Please try again.');
      setStep('failed');
    } finally {
      setTaskLoading(false);
    }
  }

  if (handoffError) {
    return (
      <section className="mx-auto w-full max-w-xl space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 text-center">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">This session has expired</h1>
        <p className="text-sm text-[var(--text-secondary)]">Pick a goal on Today to start fresh.</p>
        <Link
          href="/home"
          className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          Back to Today
        </Link>
      </section>
    );
  }

  if (step === 'wow' && homeHandoff) {
    return (
      <WowMoment loading={wowLoading} moment={wowMoment} onContinue={advanceFromWow} />
    );
  }

  if (step === 'clarify' && intent?.clarification) {
    return (
      <IntentClarificationQuestion
        clarification={intent.clarification}
        onSelect={rebuildAfterClarification}
      />
    );
  }

  if (step === 'confirm' && intent) {
    return (
      <IntentConfirmationScreen
        intent={intent}
        starting={taskLoading}
        onStart={() => void runTask(starterPrompt)}
      />
    );
  }

  if (step === 'failed') {
    return (
      <section className="mx-auto w-full max-w-xl space-y-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Something went wrong</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {failureMessage ?? 'We could not finish this request.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => {
              setFailureMessage(null);
              setStep('confirm');
            }}
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white"
          >
            Try again
          </button>
          <Link
            href="/home"
            className="rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)]"
          >
            Change Goal
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-[320px] w-full max-w-xl flex-col items-center justify-center space-y-4 text-center">
      <p className="text-lg font-medium text-[var(--text-primary)] wow-fade-in" role="status">
        {WORK_PROGRESS_MESSAGES[workMessageIndex]}
      </p>
    </section>
  );
}

export const OsaOnboardingFlow = InvisibleWorkspaceFlow;
