'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';

import { generateFirstPlan } from '@/app/login/actions';
import { OsaEyes } from '@/components/home/OsaEyes';
import { IntroProcessingView } from '@/components/first-experience/IntroProcessingView';
import { OsaFirstExperienceLayout } from '@/components/first-experience/OsaFirstExperienceLayout';

const TASK_EXAMPLES = [
  'Найти первых клиентов на новостройки',
  'Составить контент-план на месяц',
  'Разобраться, с чего начать рост',
] as const;

type IntroFormContentProps = {
  request: string;
  setRequest: (value: string) => void;
};

function IntroFormContent({ request, setRequest }: IntroFormContentProps) {
  const { pending } = useFormStatus();
  const isTyping = request.trim().length > 0;

  if (pending) {
    return <IntroProcessingView />;
  }

  return (
    <div className="osa-fe-intro-form">
      <div className="osa-fe-input-wrap">
        <label className="sr-only" htmlFor="first-request">
          Что сейчас хочется решить?
        </label>
        <textarea
          id="first-request"
          name="task"
          rows={5}
          required
          value={request}
          onChange={(event) => setRequest(event.target.value)}
          placeholder="Например: как запустить продажи новостроек"
          className={`osa-fe-input ${isTyping ? 'osa-fe-input--typing' : ''}`}
          autoFocus
        />
        <button
          type="submit"
          disabled={!request.trim()}
          aria-label="Посмотреть, что получится"
          className={`osa-fe-send ${request.trim() ? 'osa-fe-send--ready' : ''}`}
        >
          <span aria-hidden="true">↑</span>
        </button>
      </div>

      <div className="osa-fe-examples" aria-label="Примеры задач">
        {TASK_EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setRequest(example)}
            className="osa-fe-example"
          >
            {example}
          </button>
        ))}
      </div>

      <p className="osa-fe-back">
        <Link href="/login">← Назад</Link>
      </p>
    </div>
  );
}

export function FirstRequestScreen() {
  const [request, setRequest] = useState('');
  const isTyping = request.trim().length > 0;

  return (
    <OsaFirstExperienceLayout artActive={isTyping}>
      <div className="osa-fe-intro">
        <div className="osa-fe-eyes-slot">
          <OsaEyes size="lg" active skipIntro />
        </div>

        <p className="osa-fe-lead">Привет. Давайте разберёмся вместе.</p>
        <h1 className="osa-fe-title">Что сейчас хочется решить?</h1>
        <p className="osa-fe-subtitle">
          Опишите задачу своими словами — я подготовлю первый набросок.
        </p>

        <form action={generateFirstPlan}>
          <IntroFormContent request={request} setRequest={setRequest} />
        </form>
      </div>
    </OsaFirstExperienceLayout>
  );
}
