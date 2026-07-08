import Link from 'next/link';

import { FirstExperiencePrimaryCta } from '@/components/first-experience/FirstExperienceCta';
import { FirstResultExperience } from '@/components/first-experience/FirstResultExperience';
import { FirstExperienceShell } from '@/components/first-experience/FirstExperienceShell';
import { OSA_VOICE } from '@/utils/first-experience/osa-voice';

type FirstResultScreenProps = {
  plan: string | null;
};

export function FirstResultScreen({ plan }: FirstResultScreenProps) {
  const safePlan = plan?.trim() ?? null;
  const showError = !safePlan;

  if (showError) {
    return (
      <FirstExperienceShell
        presence={OSA_VOICE.result.presence}
        title={OSA_VOICE.result.errorTitle}
        subtitle={OSA_VOICE.result.errorSubtitle}
      >
        <FirstExperiencePrimaryCta href="/login/intro">{OSA_VOICE.result.retryCta}</FirstExperiencePrimaryCta>
      </FirstExperienceShell>
    );
  }

  return (
    <FirstExperienceShell
      presence={OSA_VOICE.result.presence}
      title={OSA_VOICE.result.title}
      subtitle={OSA_VOICE.result.subtitle}
      showMark={false}
    >
      <FirstResultExperience
        content={safePlan}
        autoContinueHref="/login/sign-in"
        primaryCta={{ label: OSA_VOICE.result.saveCta, href: '/login/sign-in' }}
        secondaryCta={{ label: OSA_VOICE.result.tryAnotherCta, href: '/login/intro' }}
        footer={
          <p className="text-[15px] leading-relaxed text-[var(--text-tertiary)]">
            {OSA_VOICE.result.signInFooter}{' '}
            <Link
              href="/login/sign-in"
              className="font-medium text-[var(--accent)] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {OSA_VOICE.result.signInLink}
            </Link>
          </p>
        }
      />
    </FirstExperienceShell>
  );
}
