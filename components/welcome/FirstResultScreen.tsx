import Link from 'next/link';

import { OsaEyes } from '@/components/home/OsaEyes';
import { OsaFirstExperienceLayout } from '@/components/first-experience/OsaFirstExperienceLayout';
import {
  buildDevSourceLabel,
  buildLoginFirstResultView,
  type LoginFirstResultInput,
} from '@/lib/login/first-result-view';

type FirstResultScreenProps = {
  entry: LoginFirstResultInput | null;
};

type ResultSectionProps = {
  label: string;
  children: React.ReactNode;
};

function ResultSection({ label, children }: ResultSectionProps) {
  return (
    <section className="osa-fe-result-section">
      <p className="osa-fe-result-label">{label}</p>
      <div className="osa-fe-result-body">{children}</div>
    </section>
  );
}

export function FirstResultScreen({ entry }: FirstResultScreenProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const safeContent = entry?.content?.trim() ?? '';
  const showError = !safeContent;

  if (showError) {
    return (
      <OsaFirstExperienceLayout>
        <div className="osa-fe-result">
          <div className="osa-fe-eyes-slot">
            <OsaEyes size="lg" active skipIntro />
          </div>
          <p className="osa-fe-lead">Не получилось собрать ответ.</p>
          <p className="osa-fe-subtitle">Попробуйте сформулировать задачу чуть иначе.</p>
          <div className="osa-fe-actions">
            <Link href="/login/intro" className="osa-fe-primary-btn">
              Изменить задачу
            </Link>
          </div>
        </div>
      </OsaFirstExperienceLayout>
    );
  }

  const view = buildLoginFirstResultView({
    task: entry?.task ?? '',
    content: safeContent,
    usedFallback: entry?.usedFallback,
    failureReason: entry?.failureReason,
  });

  return (
    <OsaFirstExperienceLayout artActive>
      <div className="osa-fe-result">
        {isDev ? (
          <div
            className={`osa-fe-dev ${view.source === 'fallback' ? 'osa-fe-dev--fallback' : 'osa-fe-dev--ai'}`}
            role="status"
            aria-live="polite"
          >
            <p className="osa-fe-dev-label">{buildDevSourceLabel(view.source)}</p>
            {view.devNotice ? <p className="osa-fe-dev-notice">{view.devNotice}</p> : null}
            {entry?.failureReason ? (
              <p className="osa-fe-dev-reason">Reason: {entry.failureReason}</p>
            ) : null}
          </div>
        ) : null}

        <div className="osa-fe-eyes-slot">
          <OsaEyes size="lg" active skipIntro />
        </div>

        <p className="osa-fe-lead">Посмотрела. Вот что вижу.</p>
        <h1 className="osa-fe-title osa-fe-title--result">{view.headline}</h1>

        <div className="osa-fe-result-sections">
          {view.blocker ? (
            <ResultSection label="Что сейчас мешает">
              <p>{view.blocker}</p>
            </ResultSection>
          ) : null}

          {view.firstAction ? (
            <ResultSection label="Что делать первым">
              <p>{view.firstAction}</p>
            </ResultSection>
          ) : null}

          {view.plan.length > 0 ? (
            <ResultSection label="План">
              <ul className="osa-fe-result-list">
                {view.plan.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </ResultSection>
          ) : null}

          {view.nextStep ? (
            <ResultSection label="Следующий шаг">
              <p>{view.nextStep}</p>
            </ResultSection>
          ) : null}
        </div>

        <div className="osa-fe-actions">
          <Link href="/login/sign-in" className="osa-fe-primary-btn">
            Продолжить со мной
          </Link>
          <Link href="/login/intro" className="osa-fe-secondary-btn">
            Изменить задачу
          </Link>
        </div>

        <p className="osa-fe-footnote">
          Уже есть аккаунт?{' '}
          <Link href="/login/sign-in" className="osa-fe-footnote-link">
            Войти
          </Link>
        </p>
      </div>
    </OsaFirstExperienceLayout>
  );
}
