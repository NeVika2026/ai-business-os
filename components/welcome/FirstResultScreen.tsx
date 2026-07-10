import Link from 'next/link';

import { OrbitMark } from '@/components/brand/OrbitMark';
import {
  FirstExperiencePrimaryCta,
  FirstExperienceSecondaryCta,
} from '@/components/first-experience/FirstExperienceCta';
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
    <section className="login-first-result-section">
      <p className="login-first-result-section-label">{label}</p>
      <div className="login-first-result-section-body">{children}</div>
    </section>
  );
}

export function FirstResultScreen({ entry }: FirstResultScreenProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const safeContent = entry?.content?.trim() ?? '';
  const showError = !safeContent;

  if (showError) {
    return (
      <main className="login-first-result-page">
        <div className="login-first-result-shell">
          <div className="login-first-result-hero">
            <OrbitMark size="md" breathe className="login-first-result-mark" />
            <p className="login-first-result-lead">Не получилось собрать ответ.</p>
          </div>
          <p className="login-first-result-copy">Попробуйте сформулировать задачу чуть иначе.</p>
          <div className="login-first-result-actions">
            <FirstExperiencePrimaryCta href="/login/intro">Изменить задачу</FirstExperiencePrimaryCta>
          </div>
        </div>
      </main>
    );
  }

  const view = buildLoginFirstResultView({
    task: entry?.task ?? '',
    content: safeContent,
    usedFallback: entry?.usedFallback,
    failureReason: entry?.failureReason,
  });

  return (
    <main className="login-first-result-page">
      <div className="login-first-result-shell">
        {isDev ? (
          <div
            className={`login-first-result-dev ${view.source === 'fallback' ? 'login-first-result-dev--fallback' : 'login-first-result-dev--ai'}`}
            role="status"
            aria-live="polite"
          >
            <p className="login-first-result-dev-label">{buildDevSourceLabel(view.source)}</p>
            {view.devNotice ? <p className="login-first-result-dev-notice">{view.devNotice}</p> : null}
            {entry?.failureReason ? (
              <p className="login-first-result-dev-reason">Reason: {entry.failureReason}</p>
            ) : null}
          </div>
        ) : null}

        <div className="login-first-result-hero">
          <OrbitMark size="md" breathe className="login-first-result-mark" />
          <p className="login-first-result-lead">Посмотрела. Вот что вижу.</p>
        </div>

        <h1 className="login-first-result-headline">{view.headline}</h1>

        <div className="login-first-result-sections">
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
              <ul className="login-first-result-list">
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

        <div className="login-first-result-actions">
          <FirstExperiencePrimaryCta href="/login/sign-in">Продолжить со мной</FirstExperiencePrimaryCta>
          <FirstExperienceSecondaryCta href="/login/intro">Изменить задачу</FirstExperienceSecondaryCta>
        </div>

        <p className="login-first-result-footnote">
          Уже есть аккаунт?{' '}
          <Link href="/login/sign-in" className="login-first-result-link">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
