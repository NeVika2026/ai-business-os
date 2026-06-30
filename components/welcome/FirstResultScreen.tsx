import Link from 'next/link';

import { NextBestStep } from '@/components/navigator/NextBestStep';

const FALLBACK_MESSAGE =
  'Не удалось подготовить первый план. Попробуйте ещё раз.' as const;

type FirstResultScreenProps = {
  plan: string | null;
  hasError: boolean;
};

export function FirstResultScreen({ plan, hasError }: FirstResultScreenProps) {
  const showError = hasError || !plan?.trim();
  const safePlan = showError ? null : plan?.trim() ?? null;

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-20 sm:py-28">
      <div className="wow-fade-in w-full max-w-2xl">
        {showError ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Что-то пошло не так
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
              {FALLBACK_MESSAGE}
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login/intro"
                className="inline-flex rounded-xl bg-[var(--accent)] px-8 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)]"
              >
                Попробовать снова
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                Вот с чего я предлагаю начать
              </h1>

              <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
                Мы подготовили черновик решения. Чтобы сохранить его и продолжить работу завтра,
                создайте аккаунт.
              </p>
            </div>

            <section
              aria-label="Первый план действий"
              className="mt-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-5 py-5 text-left sm:px-6"
            >
              <h2 className="text-sm font-medium text-[var(--text-primary)]">Первый план действий</h2>
              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                {safePlan}
              </div>
            </section>

            <NextBestStep />

            <div className="mt-10 flex justify-center">
              <Link
                href="/login/sign-in"
                className="inline-flex rounded-xl bg-[var(--accent)] px-8 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)]"
              >
                Сохранить результат
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

