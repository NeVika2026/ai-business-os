'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { improveDeliverableResult } from '@/app/(dashboard)/workspace/[projectId]/actions';
import { getHomeDeliverableResult } from '@/app/(dashboard)/home/actions';
import {
  FirstExperiencePrimaryCta,
  FirstExperienceSecondaryCta,
} from '@/components/first-experience/FirstExperienceCta';
import { OsaErrorState } from '@/components/osa/OsaErrorState';
import { OsaOrbitLoading } from '@/components/osa/OsaOrbitLoading';
import type { HomeDeliverablePayload } from '@/utils/home/real-work-mode';
import { OSA_VOICE } from '@/utils/first-experience/osa-voice';
import { OSA_LOADING_MESSAGES } from '@/utils/osa/loading-messages';

type OsaRealWorkResultProps = {
  deliverable: HomeDeliverablePayload;
  projectId: string;
  workspaceHref: string;
  onChangeTask: () => void;
};

export function OsaRealWorkResult({
  deliverable,
  projectId,
  workspaceHref,
  onChangeTask,
}: OsaRealWorkResultProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(deliverable);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canImprove = current.currentVersion < 3;

  const handleImprove = () => {
    setError(null);

    startTransition(async () => {
      const result = await improveDeliverableResult(projectId, current.id);

      if (result.status === 'failed') {
        setError(result.message);
        return;
      }

      const updated = await getHomeDeliverableResult(projectId, current.id);

      if (updated) {
        setCurrent(updated);
      } else {
        const nextVersion = current.currentVersion + 1;
        setCurrent((value) => ({
          ...value,
          currentVersion: nextVersion,
          versionLabel: `v${nextVersion} Ready`,
        }));
      }

      router.refresh();
    });
  };

  return (
    <div className="osa-real-work-result space-y-10">
      <section className="first-experience-result-card space-y-6" aria-label="Готовый результат">
        <div className="osa-real-work-header">
          <div>
            <p className="osa-real-work-eyebrow">{current.title}</p>
            <p className="osa-real-work-summary">{current.summary}</p>
          </div>
          <span className="osa-real-work-version">
            v{current.currentVersion} {OSA_VOICE.realWork.versionReady}
          </span>
        </div>

        <div className="osa-real-work-content whitespace-pre-wrap">{current.content}</div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        {canImprove ? (
          <button
            type="button"
            disabled={isPending}
            onClick={handleImprove}
            className="rounded-full border border-[var(--border-subtle)] px-5 py-2.5 text-[14px] font-medium text-[var(--text-primary)] transition hover:border-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
          >
            {isPending ? OSA_VOICE.realWork.improveLoading : OSA_VOICE.realWork.improveCta}
          </button>
        ) : null}

        <FirstExperiencePrimaryCta href={workspaceHref}>
          {OSA_VOICE.realWork.continueCta}
        </FirstExperiencePrimaryCta>

        <FirstExperienceSecondaryCta onClick={onChangeTask}>
          {OSA_VOICE.realWork.changeTaskCta}
        </FirstExperienceSecondaryCta>
      </div>

      {isPending ? (
        <OsaOrbitLoading message={OSA_LOADING_MESSAGES.improve} compact />
      ) : null}

      {error ? <OsaErrorState message={error} /> : null}

      <p className="osa-home-continue-prompt">{OSA_VOICE.realWork.continueQuestion}</p>
    </div>
  );
}
