'use client';

import { useState } from 'react';
import {
  checkMiniAiJobAction,
  getMiniAiAvailabilityAction,
  startMiniAiGenerationAction,
  type MiniAiAvailability,
} from '@/app/sozdat/actions';
import { MINI_AI_PRICING, type MiniAiKind } from '@/lib/media/mini-ai-gate';
import styles from './MiniStudio.module.css';

export function PaidAiOption({ kind }: { kind: MiniAiKind }) {
  const quote = MINI_AI_PRICING[kind];
  const [expanded, setExpanded] = useState(false);
  const [availability, setAvailability] = useState<MiniAiAvailability | null>(null);
  const [checking, setChecking] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [approved, setApproved] = useState(false);
  const [starting, setStarting] = useState(false);
  const [jobId, setJobId] = useState('');
  const [jobState, setJobState] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');

  async function openOrClose() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    setChecking(true);
    setError('');
    try {
      setAvailability(await getMiniAiAvailabilityAction(kind));
    } catch {
      setError('Не удалось проверить доступность AI-генерации.');
    } finally {
      setChecking(false);
    }
  }

  async function start() {
    if (!availability?.enabled || !approved || starting || !prompt.trim()) return;
    setStarting(true);
    setError('');
    setResultUrl('');
    try {
      const result = await startMiniAiGenerationAction({
        kind,
        prompt,
        approved,
        quotedCredits: availability.credits,
      });
      if (result.status === 'failed') setError(result.message);
      else {
        setJobId(result.jobId);
        setJobState('pending');
      }
    } catch {
      setError('Не удалось запустить генерацию. Проверьте доступ в кабинет.');
    } finally {
      setStarting(false);
    }
  }

  async function refresh() {
    if (!jobId || starting) return;
    setStarting(true);
    setError('');
    try {
      const data = await checkMiniAiJobAction({ kind, jobId });
      setJobState(data.status);
      if (data.outputUrl) setResultUrl(data.outputUrl);
      if (data.message) setError(data.message);
    } catch {
      setError('Не удалось проверить результат. Попробуйте ещё раз.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <section className={styles.aiOption} aria-label="Настоящая AI-генерация">
      <div className={styles.aiOptionTop}>
        <div>
          <p className={styles.aiOptionKicker}>ДОПОЛНИТЕЛЬНАЯ ВОЗМОЖНОСТЬ</p>
          <h2>Хочешь создать с нейросетью?</h2>
          <p>
            {kind === 'image'
              ? 'Не шаблон, а новое изображение по описанию.'
              : 'Не простую заставку, а AI-видео по описанию.'}
          </p>
        </div>
        <button
          type="button"
          className={styles.aiOptionToggle}
          onClick={() => void openOrClose()}
          aria-expanded={expanded}
        >
          {expanded ? 'Скрыть' : 'Посмотреть'}{' '}
          <span aria-hidden="true">{expanded ? '↑' : '↓'}</span>
        </button>
      </div>
      {expanded && (
        <div className={styles.aiOptionContent}>
          <div className={styles.aiPrice}>
            <strong>{quote.description}</strong>
            <span>
              {quote.credits} кредитов Runway · ориентир ${quote.dollars}
            </span>
            <small>
              Это ориентировочная стоимость. Перед реальным запуском оператор должен подтвердить
              актуальность тарифа и лимит расходов.
            </small>
          </div>
          {checking ? (
            <p role="status">Проверяем, подключена ли генерация…</p>
          ) : !availability?.enabled ? (
            <p className={styles.aiBlocked} role="status">
              Платная AI-генерация пока не включена. Бесплатная мастерская выше работает без оплаты.
              Средства не списываются.
            </p>
          ) : (
            <div className={styles.aiForm}>
              <label>
                Что создать?
                <textarea
                  value={prompt}
                  onChange={(event) => {
                    setPrompt(event.target.value);
                    setApproved(false);
                  }}
                  maxLength={700}
                  rows={4}
                  placeholder={
                    kind === 'image'
                      ? 'Например: яркий рекламный баннер для кофейни...'
                      : 'Например: кинематографичный ролик о путешествии...'
                  }
                />
              </label>
              <label className={styles.aiConsent}>
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(event) => setApproved(event.target.checked)}
                />
                Я подтверждаю платный запуск: {availability.credits} кредитов (ориентир $
                {availability.dollars}).
              </label>
              <button
                type="button"
                className={styles.aiStart}
                disabled={!approved || prompt.trim().length < 5 || starting || !!jobId}
                onClick={() => void start()}
              >
                {starting ? 'Обрабатываем…' : 'Запустить платную генерацию ↗'}
              </button>
              {jobId && (
                <div className={styles.aiJob}>
                  <p>
                    Задача отправлена. Статус: <strong>{jobState}</strong>.
                  </p>
                  <button type="button" onClick={() => void refresh()} disabled={starting}>
                    Проверить результат ↻
                  </button>
                  {resultUrl && (
                    <a href={resultUrl} target="_blank" rel="noopener noreferrer">
                      Открыть результат ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
