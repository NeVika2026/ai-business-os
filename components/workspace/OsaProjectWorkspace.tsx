'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from 'react';

import {
  continueInvestorDemoOrchestra,
  resolveOrchestraDecision,
  submitWorkspacePrompt,
} from '@/app/(dashboard)/workspace/[projectId]/actions';
import { OrbitMark } from '@/components/brand/OrbitMark';
import { OsaFirstContact } from '@/components/first-contact/OsaFirstContact';
import { DemoCompleteScreen } from '@/components/demo/DemoCompleteScreen';
import { AiOrchestraPanel } from '@/components/workspace/AiOrchestraPanel';
import { MorningBriefingPanel } from '@/components/workspace/MorningBriefingPanel';
import { ProjectLifecycleReveal } from '@/components/workspace/ProjectLifecycleReveal';
import { ProjectReplayPanel } from '@/components/workspace/ProjectReplayPanel';
import { ExecutiveMemoryPanel } from '@/components/workspace/ExecutiveMemoryPanel';
import type { OsaWorkspacePageData } from '@/utils/workspace/workspace-types';
import { buildExecutiveWorkspaceView } from '@/utils/workspace/executive-workspace-view';
import {
  investorDemoStepDuration,
  nextInvestorDemoStep,
  type InvestorDemoStep,
} from '@/utils/demo/demo-orchestrator';
import {
  clearDemoSession,
  isActiveDemoProject,
  isDemoFirstContactPending,
  markDemoFirstContactComplete,
} from '@/utils/demo/osa-demo-mode';
import {
  buildMorningBriefing,
  dismissMorningBriefing,
  hasDismissedMorningBriefing,
} from '@/utils/workspace/morning-briefing';

function subscribeToClientMount() {
  return () => {};
}

type ConversationMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type OsaProjectWorkspaceProps = {
  data: OsaWorkspacePageData;
  showLifecycleReveal?: boolean;
  demoMode?: boolean;
};

export function OsaProjectWorkspace({
  data,
  showLifecycleReveal = false,
  demoMode = false,
}: OsaProjectWorkspaceProps) {
  const router = useRouter();
  const mounted = useSyncExternalStore(subscribeToClientMount, () => true, () => false);
  const isDemoFlow = mounted && demoMode && isActiveDemoProject(data.projectId);
  const view = useMemo(() => buildExecutiveWorkspaceView(data), [data]);
  const morningBriefing = useMemo(
    () => buildMorningBriefing(data, data.userName),
    [data],
  );
  const [demoStep, setDemoStep] = useState<InvestorDemoStep>('first_contact');
  const [briefingDismissed, setBriefingDismissed] = useState(() =>
    demoMode ? false : hasDismissedMorningBriefing(data.projectId),
  );
  const [lifecycleDismissed, setLifecycleDismissed] = useState(
    () => demoMode || !showLifecycleReveal || !data.lifecycle,
  );
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>(() => {
    if (data.today.lastResult) {
      return [{ id: 'seed-assistant', role: 'assistant', content: data.today.lastResult }];
    }

    return [];
  });
  const [error, setError] = useState<string | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [showExecutiveMemory, setShowExecutiveMemory] = useState(false);
  const [isPending, startTransition] = useTransition();

  const latestMessage = messages.at(-1) ?? null;

  useEffect(() => {
    if (!isDemoFlow || demoStep !== 'first_contact' || isDemoFirstContactPending()) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDemoStep('briefing');
    }, 0);

    return () => window.clearTimeout(timer);
  }, [demoStep, isDemoFlow]);

  useEffect(() => {
    if (!isDemoFlow) {
      return;
    }

    if (
      demoStep === 'workspace' ||
      demoStep === 'decision' ||
      demoStep === 'orchestra_continue' ||
      demoStep === 'memory' ||
      demoStep === 'replay' ||
      demoStep === 'complete'
    ) {
      dismissMorningBriefing(data.projectId);
    }

    if (demoStep === 'complete') {
      clearDemoSession();
    }
  }, [data.projectId, demoStep, isDemoFlow]);

  useEffect(() => {
    if (!isDemoFlow || demoStep === 'decision') {
      return;
    }

    const duration = investorDemoStepDuration(demoStep);

    if (!duration) {
      return;
    }

    const timer = window.setTimeout(() => {
      const next = nextInvestorDemoStep(demoStep);

      if (next) {
        setDemoStep(next);
      }
    }, duration);

    return () => window.clearTimeout(timer);
  }, [demoStep, isDemoFlow]);

  useEffect(() => {
    if (!isDemoFlow || demoStep !== 'decision') {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(() => {
      startTransition(async () => {
        await resolveOrchestraDecision(data.projectId);
        await continueInvestorDemoOrchestra(data.projectId);

        if (cancelled) {
          return;
        }

        router.refresh();
        setDemoStep('orchestra_continue');
      });
    }, investorDemoStepDuration('decision') ?? 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [data.projectId, demoStep, isDemoFlow, router]);

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
        { id: crypto.randomUUID(), role: 'assistant', content: result.content },
      ]);
      router.refresh();
    });
  };

  const handleStartWork = () => {
    dismissMorningBriefing(data.projectId);
    setBriefingDismissed(true);
    handleSubmit(morningBriefing.primaryPrompt);
  };

  const handleLifecycleContinue = () => {
    if (!data.lifecycle) {
      setLifecycleDismissed(true);
      router.replace(`/workspace/${data.projectId}`);
      return;
    }

    setLifecycleDismissed(true);
    dismissMorningBriefing(data.projectId);
    setBriefingDismissed(true);
    router.replace(`/workspace/${data.projectId}`);
    handleSubmit(data.lifecycle.firstStepPrompt);
  };

  if (isDemoFlow && demoStep === 'first_contact' && isDemoFirstContactPending()) {
    return (
      <OsaFirstContact
        onComplete={() => {
          markDemoFirstContactComplete();
          setDemoStep('briefing');
        }}
      />
    );
  }

  if (isDemoFlow && demoStep === 'complete') {
    return (
      <div className="osa-workspace-surface">
        <DemoCompleteScreen
          projectTitle={data.header.title}
          onClose={() => {
            router.replace(`/workspace/${data.projectId}`);
          }}
        />
      </div>
    );
  }

  if (!lifecycleDismissed && data.lifecycle && !isDemoFlow) {
    return (
      <div className="osa-workspace-surface osa-executive-workspace min-h-[calc(100vh-8rem)]">
        <ProjectLifecycleReveal
          lifecycle={data.lifecycle}
          isPending={isPending}
          onContinue={handleLifecycleContinue}
        />
      </div>
    );
  }

  const showsMorningBriefing = isDemoFlow ? demoStep === 'briefing' : !briefingDismissed;
  const showsReplayPanel = isDemoFlow ? demoStep === 'replay' : showReplay;
  const showsExecutiveMemoryPanel = isDemoFlow ? demoStep === 'memory' : showExecutiveMemory;

  if (showsMorningBriefing) {
    return (
      <div className="osa-workspace-surface osa-executive-workspace min-h-[calc(100vh-8rem)]">
        <MorningBriefingPanel briefing={morningBriefing} isPending={isPending} onStart={handleStartWork} />
      </div>
    );
  }

  if (showsReplayPanel) {
    return (
      <div className="osa-workspace-surface">
        <ProjectReplayPanel replay={data.replay} onClose={() => setShowReplay(false)} />
      </div>
    );
  }

  if (showsExecutiveMemoryPanel) {
    return (
      <div className="osa-workspace-surface">
        <ExecutiveMemoryPanel
          memory={data.executiveMemory}
          onClose={() => setShowExecutiveMemory(false)}
        />
      </div>
    );
  }

  return (
    <div className="osa-workspace-surface osa-executive-workspace mx-auto w-full max-w-[1120px] px-2 pb-16 pt-4 sm:px-4">
      <header className="osa-exec-fade flex items-start justify-between gap-6">
        <div>
          <p className="text-[13px] tracking-[0.04em] text-[var(--text-secondary)]">{view.projectTitle}</p>
          <h1 className="mt-2 max-w-2xl text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.03em] text-[var(--text-primary)]">
            {view.todayHeadline}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowExecutiveMemory(true)}
              className="rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              Executive Memory
            </button>
            <button
              type="button"
              onClick={() => setShowReplay(true)}
              className="rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              Replay Project
            </button>
          </div>
          <p className="hidden max-w-[12rem] text-right text-[12px] leading-relaxed text-[var(--text-tertiary)] sm:block">
            {view.lastActivityLabel}
          </p>
        </div>
      </header>

      <div className="osa-exec-fade osa-exec-delay-1 mt-14 flex flex-col items-center">
        <div className="osa-orbit-presence">
          <OrbitMark size="lg" breathe className="text-[var(--accent)]" />
        </div>
        <p className="mt-6 max-w-md text-center text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {view.contextLine}
        </p>
      </div>

      <div className="osa-exec-fade osa-exec-delay-2 mt-12 grid gap-10 xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-16">
        <div className="min-w-0">
          <section className="rounded-[28px] bg-[var(--surface-1)] px-8 py-10 sm:px-10 sm:py-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              {view.focus.label}
            </p>
            <h2 className="mt-5 max-w-2xl text-[clamp(1.5rem,2.4vw,2rem)] font-medium leading-[1.25] tracking-[-0.02em] text-[var(--text-primary)]">
              {view.focus.title}
            </h2>
            <div className="mt-8 max-w-xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Почему это важно
              </p>
              <p className="mt-3 text-[15px] leading-[1.65] text-[var(--text-secondary)]">{view.focus.reason}</p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSubmit(view.focus.prompt)}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3.5 text-[15px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? 'OSA работает…' : view.focus.ctaLabel}
            </button>
          </section>

          <section className="mt-10">
            {data.orchestra ? (
              <AiOrchestraPanel
                orchestra={data.orchestra}
                isPending={isPending}
                onResolveBlocked={() => {
                  startTransition(async () => {
                    const result = await resolveOrchestraDecision(data.projectId);

                    if (result.status === 'failed') {
                      setError(result.message);
                      return;
                    }

                    router.refresh();
                  });
                }}
              />
            ) : (
              <>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  AI-команда
                </p>
                <ul className="mt-5 divide-y divide-[var(--border-subtle)]/70">
                  {view.team.map((member) => (
                    <li key={member.role} className="flex items-baseline justify-between gap-6 py-4 first:pt-0">
                      <div>
                        <p className="text-[15px] font-medium text-[var(--text-primary)]">{member.role}</p>
                        <p
                          className={`mt-1 text-[14px] ${
                            member.state === 'active'
                              ? 'text-[var(--text-secondary)]'
                              : member.state === 'waiting'
                                ? 'text-[var(--accent)]'
                                : 'text-[var(--text-tertiary)]'
                          }`}
                        >
                          {member.status}
                        </p>
                      </div>
                      <span
                        className={`osa-team-pulse h-2 w-2 shrink-0 rounded-full ${
                          member.state === 'active'
                            ? 'bg-[var(--accent)]'
                            : member.state === 'waiting'
                              ? 'bg-[var(--accent)]/50'
                              : 'bg-[var(--border-subtle)]'
                        }`}
                        aria-hidden="true"
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="mt-12 border-t border-[var(--border-subtle)]/60 pt-8">
            {latestMessage ? (
              <div className="mb-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  {latestMessage.role === 'user' ? 'Вы' : 'OSA'}
                </p>
                <p className="mt-3 max-w-2xl whitespace-pre-wrap text-[15px] leading-[1.65] text-[var(--text-primary)]">
                  {latestMessage.content}
                </p>
              </div>
            ) : null}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <label className="sr-only" htmlFor="workspace-prompt">
                Задача для OSA
              </label>
              <textarea
                id="workspace-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={2}
                disabled={isPending}
                placeholder="Или опишите задачу своими словами…"
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-transparent bg-[var(--surface-1)] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-subtle)]"
              />
              {error ? (
                <p className="text-sm text-red-500 sm:order-last sm:w-full">{error}</p>
              ) : null}
            </form>
          </section>
        </div>

        <aside className="xl:pt-2">
          <section className="rounded-[24px] bg-[var(--surface-1)] px-6 py-7">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Executive Brain
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Личный помощник CEO. Рекомендации, не журнал.
            </p>

            <ul className="mt-7 space-y-5">
              {view.brief.map((item) => (
                <li key={`${item.tone}-${item.text}`}>
                  {item.tone === 'risk' ? (
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Следующий риск
                    </p>
                  ) : null}
                  <div className="mt-1 flex gap-3 text-[14px] leading-relaxed">
                    <span
                      className={`mt-0.5 shrink-0 ${
                        item.tone === 'done'
                          ? 'text-[var(--text-secondary)]'
                          : item.tone === 'waiting'
                            ? 'text-[var(--text-primary)]'
                            : 'text-[var(--accent)]'
                      }`}
                      aria-hidden="true"
                    >
                      {item.tone === 'done' ? '✔' : item.tone === 'waiting' ? '◦' : '!'}
                    </span>
                    <span
                      className={
                        item.tone === 'risk' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                      }
                    >
                      {item.text}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {view.memoryLine ? (
              <p className="mt-8 border-t border-[var(--border-subtle)]/60 pt-6 text-[13px] text-[var(--text-tertiary)]">
                {view.memoryLine}
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
