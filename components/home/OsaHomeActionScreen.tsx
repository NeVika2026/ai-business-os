'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useRef, useState, useTransition, type CSSProperties } from 'react';

import {
  advanceHomeRealWork,
  prepareHomeDirectorPlan,
  startHomeRealWork,
  type HomeOrchestraSnapshot,
} from '@/app/(dashboard)/home/actions';
import { OsaActiveAgent } from '@/components/home/OsaActiveAgent';
import { OsaClarifyPanel } from '@/components/home/OsaClarifyPanel';
import { OsaDirectorPlanPanel } from '@/components/home/OsaDirectorPlanPanel';
import { BusinessFactoryHero } from '@/components/home/BusinessFactoryHero';
import homeStyles from '@/components/home/BusinessFactoryHome.module.css';
import {
  OsaHeroPresence,
  type OsaHeroPresenceHandle,
} from '@/components/home/OsaHeroPresence';
import { OsaSkillModeLine } from '@/components/home/OsaSkillModeLine';
import { OsaRealWorkResult } from '@/components/home/OsaRealWorkResult';
import { OsaErrorState } from '@/components/osa/OsaErrorState';
import { BusinessZavodHomeExperience } from '@/components/platform/BusinessZavodHomeExperience';
import { VoiceInputButton } from '@/components/platform/VoiceInputButton';
import type { HomeQuickActionId } from '@/utils/home/home-action';
import {
  HERO_HOME_GREETING,
  HERO_HOME_PLACEHOLDER,
  heroLightIntensity,
  heroLightWarmth,
} from '@/utils/home/hero-experience';
import type { HomeDirectorPlanResult } from '@/utils/home/director-plan';
import type {
  ClarificationAnswer,
  HomeDeliverablePayload,
  RealWorkTaskType,
} from '@/utils/home/real-work-mode';

type OsaHomeActionScreenProps = {
  organizationName: string;
};

type ScreenPhase = 'input' | 'clarify' | 'plan' | 'working' | 'result' | 'error';

type ReadyDirectorPlan = Extract<HomeDirectorPlanResult, { status: 'ready' }>;

const ORCHESTRA_POLL_MS = 900;

export function OsaHomeActionScreen({ organizationName }: OsaHomeActionScreenProps) {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt')?.trim() ?? '';
  const heroRef = useRef<OsaHeroPresenceHandle>(null);
  const [introPlayed, setIntroPlayed] = useState(Boolean(initialPrompt));
  const [prompt, setPrompt] = useState(initialPrompt);
  const [phase, setPhase] = useState<ScreenPhase>('input');
  const [heroReady, setHeroReady] = useState(Boolean(initialPrompt));
  const [taskType, setTaskType] = useState<RealWorkTaskType | null>(null);
  const [skillModeLabel, setSkillModeLabel] = useState<string | null>(null);
  const [clarifyQuestions, setClarifyQuestions] = useState<string[]>([]);
  const [directorPlan, setDirectorPlan] = useState<ReadyDirectorPlan | null>(null);
  const [directorClarifications, setDirectorClarifications] = useState<ClarificationAnswer[]>([]);
  const [orchestra, setOrchestra] = useState<HomeOrchestraSnapshot | null>(null);
  const [deliverable, setDeliverable] = useState<HomeDeliverablePayload | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [workspaceHref, setWorkspaceHref] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; hint: string } | null>(null);
  const [lastQuickActionId, setLastQuickActionId] = useState<HomeQuickActionId | undefined>();
  const [isPending, startTransition] = useTransition();
  const orchestraLoopRef = useRef(false);

  const isTyping = prompt.trim().length > 0;
  const showCompose = phase === 'input' || phase === 'error';
  const companionPhase =
    phase === 'working' || phase === 'clarify' || phase === 'plan' || phase === 'error';
  const isThinking = phase === 'working';

  const canvasStyle = useMemo(
    () =>
      ({
        '--osa-hero-light': heroLightIntensity(heroReady ? 'ready' : 'eyes-form', isTyping),
        '--osa-hero-warmth': heroLightWarmth(heroReady ? 'ready' : 'eyes-form', isTyping),
      }) as CSSProperties,
    [heroReady, isTyping],
  );

  const handleHeroReady = useCallback(() => {
    setIntroPlayed(true);
    setHeroReady(true);
  }, []);

  const resetToInput = () => {
    orchestraLoopRef.current = false;
    setPhase('input');
    setError(null);
    setPrompt('');
    setTaskType(null);
    setSkillModeLabel(null);
    setClarifyQuestions([]);
    setDirectorPlan(null);
    setDirectorClarifications([]);
    setOrchestra(null);
    setDeliverable(null);
    setProjectId(null);
    setWorkspaceHref(null);
    setHeroReady(true);
  };

  const runOrchestraLoop = useCallback(
    (activeProjectId: string, activeTaskType: RealWorkTaskType) => {
      if (orchestraLoopRef.current) {
        return;
      }

      orchestraLoopRef.current = true;

      const tick = async () => {
        const result = await advanceHomeRealWork(activeProjectId, activeTaskType);

        if (result.status === 'ok') {
          orchestraLoopRef.current = false;
          setDeliverable(result.deliverable);
          setPhase('result');
          return;
        }

        if (result.status === 'failed') {
          orchestraLoopRef.current = false;
          setError({ message: result.message, hint: result.hint });
          setPhase('error');
          return;
        }

        setOrchestra(result.orchestra);
        window.setTimeout(tick, ORCHESTRA_POLL_MS);
      };

      void tick();
    },
    [],
  );

  const executeRealWork = (
    quickActionId?: HomeQuickActionId,
    clarifications?: ClarificationAnswer[],
  ) => {
    const trimmed = prompt.trim();

    if (!trimmed && !quickActionId) {
      return;
    }

    setError(null);
    setDeliverable(null);
    setOrchestra(null);
    setPhase('working');
    setLastQuickActionId(quickActionId);

    startTransition(async () => {
      const result = await startHomeRealWork(trimmed, {
        quickActionId,
        taskType: taskType ?? undefined,
        clarifications,
      });

      if (result.status === 'failed') {
        setError({ message: result.message, hint: result.hint });
        setPhase('error');
        return;
      }

      if (result.status === 'clarify') {
        setTaskType(result.taskType);
        setClarifyQuestions(result.questions);
        setProjectId(result.projectId);
        setSkillModeLabel(result.skillModeLabel);
        setPhase('clarify');
        return;
      }

      setSkillModeLabel(result.skillModeLabel);

      setTaskType(result.status === 'working' ? result.taskType : taskType);
      setProjectId(result.projectId);
      setWorkspaceHref(`/workspace/${result.projectId}`);

      if (result.status === 'ok') {
        setDeliverable(result.deliverable);
        setPhase('result');
        return;
      }

      setOrchestra(result.orchestra);
      setPhase('working');
      runOrchestraLoop(result.projectId, result.taskType);
    });
  };

  const prepareDirectorPlan = (
    quickActionId?: HomeQuickActionId,
    clarifications: ClarificationAnswer[] = [],
  ) => {
    const trimmed = prompt.trim();

    if (!trimmed && !quickActionId) {
      return;
    }

    setError(null);
    setDirectorPlan(null);
    setLastQuickActionId(quickActionId);

    startTransition(async () => {
      const result = await prepareHomeDirectorPlan(trimmed, {
        quickActionId,
        clarifications,
      });

      if (result.status === 'failed') {
        setError({ message: result.message, hint: result.hint });
        setPhase('error');
        return;
      }

      setTaskType(result.taskType);
      setSkillModeLabel(result.skillModeLabel);

      if (result.status === 'clarify') {
        setClarifyQuestions(result.questions);
        setDirectorClarifications([]);
        setPhase('clarify');
        return;
      }

      setDirectorPlan(result);
      setDirectorClarifications(clarifications);
      setPhase('plan');
    });
  };

  const confirmDirectorPlan = () => {
    if (!directorPlan) {
      return;
    }

    executeRealWork(lastQuickActionId, directorClarifications);
  };

  const runTask = (quickActionId?: HomeQuickActionId) => {
    prepareDirectorPlan(quickActionId);
  };

  const handlePromptChange = (value: string) => {
    if (!heroReady) {
      heroRef.current?.skip();
    }

    setPrompt(value);
  };

  const busy = isPending || phase === 'working';
  const canSubmit = prompt.trim().length > 0 && !busy && phase !== 'clarify';

  const canvasClassName = [
    'osa-home-canvas',
    'flex min-h-full flex-1 flex-col',
    phase !== 'result' ? homeStyles.factoryCanvas : '',
    isTyping ? 'osa-home-canvas--typing' : '',
    isThinking ? 'osa-home-canvas--thinking' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (phase === 'result' && deliverable && projectId && workspaceHref) {
    return (
      <main className={canvasClassName} style={canvasStyle}>
        <div className="osa-home-depth" aria-hidden="true" />
        <div className="osa-home-glow" aria-hidden="true" />
        <div className="osa-home-hero-light" aria-hidden="true" />

        <div className="osa-home-stage relative z-[1] mx-auto flex w-full max-w-[920px] flex-1 flex-col px-5 pb-12 pt-8 sm:px-8">
          <OsaRealWorkResult
            deliverable={deliverable}
            projectId={projectId}
            workspaceHref={workspaceHref}
            onChangeTask={resetToInput}
          />
        </div>

        <span className="sr-only">{organizationName}</span>
      </main>
    );
  }

  return (
    <main className={canvasClassName} style={canvasStyle}>
      <div className="osa-home-depth" aria-hidden="true" />
      <div className="osa-home-glow" aria-hidden="true" />
      <div className="osa-home-hero-light" aria-hidden="true" />
      <div className="osa-home-blob osa-home-blob--blue" aria-hidden="true" />
      <div className="osa-home-blob osa-home-blob--purple" aria-hidden="true" />

      <div className="osa-home-stage relative z-[1] mx-auto w-full max-w-[1240px] flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <div className="osa-home-grid">
          <div className="osa-home-main">
            <div className="osa-home-hero w-full">
              <div className="mb-5 lg:hidden">
                <BusinessFactoryHero active={isTyping} thinking={isThinking} />
              </div>

              <div className="osa-home-eyes-slot">
                <OsaHeroPresence
                  ref={heroRef}
                  mode={introPlayed || companionPhase ? 'companion' : 'intro'}
                  lookStraight={phase === 'working'}
                  skipIntro={introPlayed}
                  onReady={handleHeroReady}
                />
              </div>

              {showCompose ? (
                <div
                  className={`osa-home-compose ${heroReady ? 'osa-home-compose--visible' : 'osa-home-compose--waiting'}`}
                >
                  <h1 className="osa-home-greeting osa-home-greeting--visible">{HERO_HOME_GREETING}</h1>

                  <div className="osa-home-input-wrap">
                    <label className="sr-only" htmlFor="osa-home-prompt">
                      {HERO_HOME_GREETING}
                    </label>
                    <textarea
                      id="osa-home-prompt"
                      value={prompt}
                      onChange={(event) => handlePromptChange(event.target.value)}
                      onFocus={() => heroRef.current?.skip()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canSubmit) {
                          event.preventDefault();
                          runTask();
                        }
                      }}
                      rows={5}
                      disabled={busy}
                      placeholder={heroReady ? HERO_HOME_PLACEHOLDER : ''}
                      className={`osa-home-input ${isTyping ? 'osa-home-input--typing' : ''}`}
                      autoFocus
                    />
                    <div className="absolute bottom-4 right-[4.65rem]">
                      <VoiceInputButton
                        value={prompt}
                        onChange={handlePromptChange}
                        disabled={busy}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!canSubmit}
                      onClick={() => runTask()}
                      aria-label="Отправить"
                      className={`osa-home-send ${canSubmit ? 'osa-home-send--ready' : ''}`}
                    >
                      <span aria-hidden="true">↑</span>
                    </button>
                  </div>

                  {phase === 'error' && error ? (
                    <OsaErrorState
                      message={error.message}
                      hint={error.hint}
                      onRetry={() => runTask(lastQuickActionId)}
                    />
                  ) : null}
                </div>
              ) : null}

              {skillModeLabel &&
              (phase === 'clarify' || phase === 'plan' || phase === 'working') ? (
                <OsaSkillModeLine label={skillModeLabel} />
              ) : null}

              {phase === 'clarify' && taskType ? (
                <OsaClarifyPanel
                  taskType={taskType}
                  questions={clarifyQuestions}
                  disabled={isPending}
                  onSubmit={(answers) => prepareDirectorPlan(lastQuickActionId, answers)}
                />
              ) : null}

              {phase === 'plan' && directorPlan ? (
                <OsaDirectorPlanPanel
                  plan={directorPlan}
                  disabled={isPending}
                  onStart={confirmDirectorPlan}
                  onBack={resetToInput}
                />
              ) : null}

              {phase === 'working' && orchestra ? <OsaActiveAgent orchestra={orchestra} /> : null}

              {phase === 'working' && !orchestra ? (
                <p className="osa-live-discovery" aria-live="polite">
                  Думаю…
                </p>
              ) : null}
            </div>
          </div>

          <div className="osa-home-side">
            <div className="hidden lg:block">
              <BusinessFactoryHero active={isTyping} thinking={isThinking} />
            </div>
          </div>
        </div>

        {showCompose ? <BusinessZavodHomeExperience /> : null}
      </div>

      <span className="sr-only">{organizationName}</span>
    </main>
  );
}
