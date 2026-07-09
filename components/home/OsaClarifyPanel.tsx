'use client';

import { useState } from 'react';

import { OSA_VOICE } from '@/utils/first-experience/osa-voice';
import { REAL_WORK_TASK_LABELS, type RealWorkTaskType } from '@/utils/home/real-work-mode';

type OsaClarifyPanelProps = {
  taskType: RealWorkTaskType;
  questions: string[];
  disabled?: boolean;
  onSubmit: (answers: { question: string; answer: string }[]) => void;
};

export function OsaClarifyPanel({
  taskType,
  questions,
  disabled = false,
  onSubmit,
}: OsaClarifyPanelProps) {
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));

  const canSubmit =
    !disabled && answers.every((answer) => answer.trim().length > 0) && questions.length > 0;

  return (
    <section className="osa-clarify-panel" aria-label="Уточняющие вопросы">
      <p className="osa-clarify-intro">{OSA_VOICE.realWork.clarifyIntro}</p>
      <p className="osa-clarify-type">
        Задача: <span>{REAL_WORK_TASK_LABELS[taskType]}</span>
      </p>

      <div className="osa-clarify-questions">
        {questions.map((question, index) => (
          <label key={question} className="osa-clarify-field">
            <span className="osa-clarify-label">{question}</span>
            <input
              type="text"
              value={answers[index] ?? ''}
              disabled={disabled}
              onChange={(event) => {
                setAnswers((current) => {
                  const next = [...current];
                  next[index] = event.target.value;
                  return next;
                });
              }}
              className="osa-clarify-input"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() =>
          onSubmit(
            questions.map((question, index) => ({
              question,
              answer: answers[index]?.trim() ?? '',
            })),
          )
        }
        className="osa-clarify-submit"
      >
        {OSA_VOICE.realWork.clarifyCta}
      </button>
    </section>
  );
}
