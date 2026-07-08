'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { continueInvestorDemoOrchestra } from '@/app/(dashboard)/workspace/[projectId]/actions';
import { OrbitMark } from '@/components/brand/OrbitMark';
import {
  FirstExperiencePrimaryCta,
  FirstExperienceSecondaryCta,
} from '@/components/first-experience/FirstExperienceCta';
import { buildFirstResultPresentation } from '@/utils/first-experience/first-result-presentation';
import { OSA_VOICE } from '@/utils/first-experience/osa-voice';

const WOW_REVEAL_MS = 1_600;

type FirstResultCta = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type FirstResultExperienceProps = {
  content: string;
  projectId?: string | null;
  workspaceHref?: string | null;
  autoContinueHref?: string | null;
  primaryCta?: FirstResultCta;
  secondaryCta?: FirstResultCta;
  footer?: React.ReactNode;
};

export function FirstResultExperience({
  content,
  projectId,
  workspaceHref,
  autoContinueHref,
  primaryCta,
  secondaryCta,
  footer,
}: FirstResultExperienceProps) {
  const router = useRouter();
  const presentation = useMemo(() => buildFirstResultPresentation(content), [content]);
  const [phase, setPhase] = useState<'wow' | 'revealed'>('wow');
  const [autoContinueDismissed, setAutoContinueDismissed] = useState(false);
  const [autoContinueError, setAutoContinueError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canAutoContinue = Boolean((projectId && workspaceHref) || autoContinueHref);

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase('revealed'), WOW_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const handleAutoContinueYes = () => {
    setAutoContinueError(null);

    if (projectId && workspaceHref) {
      startTransition(async () => {
        const result = await continueInvestorDemoOrchestra(projectId);

        if (result.status === 'failed') {
          setAutoContinueError(result.message);
          return;
        }

        router.push(workspaceHref);
      });
      return;
    }

    if (autoContinueHref) {
      router.push(autoContinueHref);
    }
  };

  const showAutoContinue = phase === 'revealed' && canAutoContinue && !autoContinueDismissed;
  const showManualCtas = phase === 'revealed' && (!canAutoContinue || autoContinueDismissed);

  return (
    <div className="space-y-12">
      {phase === 'wow' ? (
        <section
          className="first-result-wow-reveal py-12 sm:py-16"
          aria-live="polite"
          aria-label="OSA готовит ответ"
        >
          <div className="first-result-wow-orbit flex justify-start">
            <OrbitMark size="lg" breathe className="text-[var(--accent)]" />
          </div>
          <p className="first-result-wow-phrase mt-12 text-[clamp(1.2rem,3vw,1.6rem)] font-normal leading-snug tracking-[-0.02em] text-[var(--text-primary)]">
            {presentation.wowPhrase}
          </p>
        </section>
      ) : null}

      {phase === 'revealed' ? (
        <section className="first-result-reveal space-y-10" aria-label="Первый ответ">
          <div className="first-experience-result-card space-y-7">
            {presentation.summaryLines.length > 0 ? (
              <div className="first-result-key-insight space-y-4">
                <p className="text-[14px] text-[var(--text-secondary)]">{OSA_VOICE.result.keyInsight}</p>
                <div className="space-y-2.5">
                  {presentation.summaryLines.map((line) => (
                    <p
                      key={line}
                      className="text-[clamp(1.08rem,2.2vw,1.22rem)] font-medium leading-[1.45] tracking-[-0.01em] text-[var(--text-primary)]"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {presentation.body ? (
              <div className="space-y-4 border-t border-[var(--border-subtle)]/60 pt-6">
                <p className="text-[14px] text-[var(--text-tertiary)]">{OSA_VOICE.result.details}</p>
                <div className="whitespace-pre-wrap text-[clamp(1rem,2vw,1.05rem)] leading-[1.8] text-[var(--text-secondary)]">
                  {presentation.body}
                </div>
              </div>
            ) : null}
          </div>

          {showAutoContinue ? (
            <div className="first-result-auto-continue space-y-5 px-1">
              <p className="text-[clamp(1rem,2vw,1.1rem)] leading-relaxed text-[var(--text-primary)]">
                {OSA_VOICE.result.autoContinueQuestion}
              </p>
              <div className="flex flex-wrap gap-3">
                <FirstExperiencePrimaryCta disabled={isPending} onClick={handleAutoContinueYes}>
                  {isPending ? OSA_VOICE.result.autoContinueLoading : OSA_VOICE.result.autoContinueYes}
                </FirstExperiencePrimaryCta>
                <FirstExperienceSecondaryCta onClick={() => setAutoContinueDismissed(true)}>
                  {OSA_VOICE.result.autoContinueNo}
                </FirstExperienceSecondaryCta>
              </div>
              {autoContinueError ? (
                <p className="text-sm text-red-600">{autoContinueError}</p>
              ) : null}
            </div>
          ) : null}

          {showManualCtas ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              {primaryCta?.href ? (
                <FirstExperiencePrimaryCta href={primaryCta.href}>{primaryCta.label}</FirstExperiencePrimaryCta>
              ) : null}
              {primaryCta && !primaryCta.href ? (
                <FirstExperiencePrimaryCta onClick={primaryCta.onClick}>
                  {primaryCta.label}
                </FirstExperiencePrimaryCta>
              ) : null}
              {secondaryCta?.href ? (
                <FirstExperienceSecondaryCta href={secondaryCta.href}>
                  {secondaryCta.label}
                </FirstExperienceSecondaryCta>
              ) : null}
              {secondaryCta && !secondaryCta.href ? (
                <FirstExperienceSecondaryCta onClick={secondaryCta.onClick}>
                  {secondaryCta.label}
                </FirstExperienceSecondaryCta>
              ) : null}
            </div>
          ) : null}

          {footer}
        </section>
      ) : null}
    </div>
  );
}
