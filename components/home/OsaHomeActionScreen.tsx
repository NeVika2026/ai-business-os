'use client';

import { useRouter, useSearchParams } from 'next/navigation';
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
import { OsaSkillModeLine } from '@/components/home/OsaSkillModeLine';
import { OsaRealWorkResult } from '@/components/home/OsaRealWorkResult';
import { OsaErrorState } from '@/components/osa/OsaErrorState';
import { BusinessZavodHomeExperience } from '@/components/platform/BusinessZavodHomeExperience';
import { VoiceInputButton } from '@/components/platform/VoiceInputButton';
import { buildCreateStudioHref, detectCreateStudioMode } from '@/utils/platform/create-studio';
import type { HomeQuickActionId } from '@/utils/home/home-action';
import {
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt')?.trim() ?? '';
  const [prompt, setPrompt] = useState(initialPrompt);
  const [phase, setPhase] = useState<ScreenPhase>('input');
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
  const isThinking = phase === 'working';

  const canvasStyle = useMemo(
    () =>
      ({
        '--osa-hero-light': heroLightIntensity('ready', isTyping),
        '--osa-hero-warmth': heroLightWarmth('ready', isTyping),
      }) as CSSProperties,
    [heroReady, isTyping],
  );

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
    const trimmed = prompt.trim();

    if (!quickActionId && trimmed) {
      const studioMode = detectCreateStudioMode(trimmed);

      if (studioMode) {
        router.push(buildCreateStudioHref(studioMode, trimmed));
        return;
      }
    }

    prepareDirectorPlan(quickActionId);
  };

  const handlePromptChange = (value: string) => {
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
            <div className={homeStyles.heroCopy}>
              <p className={homeStyles.eyebrow}>AI-ПЛАТФОРМА ДЛЯ РЕАЛЬНОГО БИЗНЕСА</p>
              <h1 className={homeStyles.heroTitle}>
                <span>Превращаем</span>
                <strong>идеи в готовый</strong>
                <strong>результат</strong>
              </h1>
              <p className={homeStyles.heroLead}>
                OSA сама собирает нужный цех: стратегия, аналитика, визуал, видео,
                продажи и автоматизация.
              </p>

              {showCompose ? (
                <div className={homeStyles.commandConsole}>
                  <div className={homeStyles.consoleHeader}>
                    <span>DIRECTOR CONSOLE</span>
                    <span><i /> OSA слушает</span>
                  </div>

                  <div className="osa-home-input-wrap">
                    <label className="sr-only" htmlFor="osa-home-prompt">
                      Опишите задачу для Бизнес-Завода
                    </label>
                    <textarea
                      id="osa-home-prompt"
                      value={prompt}
                      onChange={(event) => handlePromptChange(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canSubmit) {
                          event.preventDefault();
                          runTask();
                        }
                      }}
                      rows={5}
                      disabled={busy}
                      placeholder={HERO_HOME_PLACEHOLDER}
                      className={`osa-home-input ${isTyping ? 'osa-home-input--typing' : ''}`}
                      autoFocus
                    />
                    <div className="absolute bottom-4 right-4">
                      <VoiceInputButton
                        value={prompt}
                        onChange={handlePromptChange}
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <div className={homeStyles.consoleActions}>
                    <div className={homeStyles.quickFormats}>
                      {['Видео', 'Визуал', 'Продажи', 'Сайт'].map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={!canSubmit}
                      onClick={() => runTask()}
                      className={homeStyles.launchButton}
                    >
                      {busy ? 'Завод работает…' : 'Запустить задачу →'}
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
                  OSA строит рабочий маршрут…
                </p>
              ) : null}
            </div>
          </div>

          <div className="osa-home-side">
            <BusinessFactoryHero
              active={isTyping}
              thinking={isThinking}
              currentTask={prompt}
              agentName={orchestra?.activeAgentName}
              agentRole={orchestra?.activeAgentRole}
              activity={orchestra?.activeActivity}
              progress={orchestra?.overallProgress}
            />
          </div>
        </div>

        {showCompose ? (
          <div className={homeStyles.valueRail}>
            {[
              ['⚡', 'СОБИРАЕТ КОМАНДУ', 'Нужные AI-специалисты под каждую задачу'],
              ['◎', 'ДЕЛАЕТ РЕЗУЛЬТАТ', 'От стратегии до готового продукта'],
              ['▥', 'МАСШТАБИРУЕТ', 'Быстрее. Дешевле. Стабильнее.'],
              ['∞', 'РАСШИРЯЕТ', 'Новые навыки и инструменты по мере роста'],
            ].map(([icon, title, text]) => (
              <div key={title} className={homeStyles.valueItem}>
                <span>{icon}</span>
                <div>
                  <b>{title}</b>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {showCompose ? <BusinessZavodHomeExperience /> : null}
      </div>

      <span className="sr-only">{organizationName}</span>
    </main>
  );
}
