'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';

import { generateFirstPlan } from '@/app/login/actions';
import { FirstExperiencePrimaryCta } from '@/components/first-experience/FirstExperienceCta';
import { IntroProcessingView } from '@/components/first-experience/IntroProcessingView';
import { FirstExperienceShell } from '@/components/first-experience/FirstExperienceShell';
import { OSA_VOICE } from '@/utils/first-experience/osa-voice';

const QUICK_PROMPTS = [
  { label: 'Стратегия', value: 'Подготовить стратегию роста на ближайший квартал' },
  { label: 'Контент', value: 'Составить контент-план на месяц для соцсетей' },
  { label: 'Разобраться', value: 'Проанализировать текущую ситуацию в бизнесе и предложить приоритеты' },
] as const;

type IntroFormContentProps = {
  request: string;
  setRequest: (value: string) => void;
};

function IntroFormContent({ request, setRequest }: IntroFormContentProps) {
  const { pending } = useFormStatus();

  if (pending) {
    return <IntroProcessingView />;
  }

  return (
    <div className="space-y-12">
      <section className="space-y-8">
        <label className="block space-y-4">
          <span className="sr-only">{OSA_VOICE.intro.title}</span>
          <textarea
            id="first-request"
            name="task"
            rows={4}
            required
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            placeholder={OSA_VOICE.intro.placeholder}
            className="first-experience-input"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => setRequest(prompt.value)}
              className="first-experience-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {prompt.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <FirstExperiencePrimaryCta type="submit" disabled={!request.trim()}>
            {OSA_VOICE.intro.cta}
          </FirstExperiencePrimaryCta>
          <p className="max-w-md text-[15px] leading-relaxed text-[var(--text-tertiary)]">
            {OSA_VOICE.intro.note}
          </p>
        </div>
      </section>

      <p className="text-[15px] text-[var(--text-tertiary)]">
        <Link
          href="/login"
          className="transition hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          ← Назад
        </Link>
      </p>
    </div>
  );
}

export function FirstRequestScreen() {
  const [request, setRequest] = useState('');

  return (
    <FirstExperienceShell
      presence={OSA_VOICE.intro.presence}
      title={OSA_VOICE.intro.title}
      subtitle={OSA_VOICE.intro.subtitle}
    >
      <form action={generateFirstPlan}>
        <IntroFormContent request={request} setRequest={setRequest} />
      </form>
    </FirstExperienceShell>
  );
}
