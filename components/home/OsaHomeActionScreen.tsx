'use client';

import Link from 'next/link';
import { useCallback, useState, useTransition } from 'react';

import { submitHomeTask } from '@/app/(dashboard)/home/actions';
import { FirstResultExperience } from '@/components/first-experience/FirstResultExperience';
import { FirstExperienceShell } from '@/components/first-experience/FirstExperienceShell';
import { OsaEyes } from '@/components/home/OsaEyes';
import { OsaErrorState } from '@/components/osa/OsaErrorState';
import type { HomeQuickActionId } from '@/utils/home/home-action';
import { OSA_VOICE } from '@/utils/first-experience/osa-voice';

type OsaHomeActionScreenProps = {
  organizationName: string;
};

type ScreenPhase = 'input' | 'processing' | 'result' | 'error';

export function OsaHomeActionScreen({ organizationName }: OsaHomeActionScreenProps) {
  const [prompt, setPrompt] = useState('');
  const [phase, setPhase] = useState<ScreenPhase>('input');
  const [showGreeting, setShowGreeting] = useState(false);
  const [resultContent, setResultContent] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [workspaceHref, setWorkspaceHref] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; hint: string } | null>(null);
  const [lastQuickActionId, setLastQuickActionId] = useState<HomeQuickActionId | undefined>();
  const [isPending, startTransition] = useTransition();

  const handlePresenceReady = useCallback(() => {
    setShowGreeting(true);
  }, []);

  const runTask = (quickActionId?: HomeQuickActionId) => {
    const trimmed = prompt.trim();

    if (!trimmed && !quickActionId) {
      return;
    }

    setError(null);
    setResultContent(null);
    setProjectId(null);
    setWorkspaceHref(null);
    setPhase('processing');
    setLastQuickActionId(quickActionId);
    setShowGreeting(false);

    startTransition(async () => {
      const result = await submitHomeTask(trimmed, quickActionId);

      if (result.status === 'failed') {
        setError({ message: result.message, hint: result.hint });
        setPhase('error');
        setShowGreeting(true);
        return;
      }

      setResultContent(result.content);
      setProjectId(result.projectId);
      setWorkspaceHref(`/workspace/${result.projectId}`);
      setPhase('result');
    });
  };

  const resetToInput = () => {
    setPhase('input');
    setError(null);
    setPrompt('');
    setShowGreeting(false);
    window.setTimeout(() => setShowGreeting(true), 280);
  };

  const busy = isPending || phase === 'processing';
  const canSubmit = prompt.trim().length > 0 && !busy;

  if (phase === 'result' && resultContent) {
    return (
      <FirstExperienceShell
        presence={OSA_VOICE.result.presence}
        title={OSA_VOICE.result.title}
        subtitle={OSA_VOICE.result.subtitle}
        showMark={false}
        className="pb-24"
      >
        <FirstResultExperience
          content={resultContent}
          projectId={projectId}
          workspaceHref={workspaceHref}
          primaryCta={{ label: OSA_VOICE.result.saveCta, href: workspaceHref ?? undefined }}
          secondaryCta={{ label: OSA_VOICE.result.tryAnotherCta, onClick: resetToInput }}
        />
      </FirstExperienceShell>
    );
  }

  return (
    <main className="osa-home-canvas flex min-h-full flex-1 flex-col">
      <div className="osa-home-depth" aria-hidden="true" />
      <div className="osa-home-glow" aria-hidden="true" />

      <div className="osa-home-stage relative z-[1] mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 pb-8 sm:px-7">
        <div className="flex flex-1 flex-col items-center justify-center py-[clamp(2rem,8vh,4rem)]">
          <div className="osa-home-hero w-full">
            <div className="osa-home-eyes-slot flex justify-center">
              <OsaEyes size="md" active onPresenceReady={handlePresenceReady} />
            </div>

            {phase === 'input' || phase === 'error' ? (
              <div className="osa-home-compose">
                <h1
                  className={`osa-home-greeting ${showGreeting ? 'osa-home-greeting--visible' : ''}`}
                >
                  {OSA_VOICE.home.greetingToday}
                </h1>

                <div className="osa-home-input-wrap">
                  <label className="sr-only" htmlFor="osa-home-prompt">
                    {OSA_VOICE.home.greetingToday}
                  </label>
                  <textarea
                    id="osa-home-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canSubmit) {
                        event.preventDefault();
                        runTask();
                      }
                    }}
                    rows={4}
                    disabled={busy}
                    placeholder={showGreeting ? OSA_VOICE.home.placeholder : ''}
                    className="osa-home-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={() => runTask()}
                    aria-label={OSA_VOICE.home.cta}
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

            {phase === 'processing' ? (
              <p className="osa-home-processing" aria-live="polite">
                {OSA_VOICE.home.processing}
              </p>
            ) : null}
          </div>
        </div>

        {phase === 'input' || phase === 'error' ? (
          <Link href="/home/mission-control" className="osa-home-ghost-link">
            {OSA_VOICE.home.overviewLink}
          </Link>
        ) : null}
      </div>

      <span className="sr-only">{organizationName}</span>
    </main>
  );
}
