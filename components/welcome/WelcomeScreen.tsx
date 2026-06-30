import Link from 'next/link';

import { LoginVoiceWelcome } from '@/components/welcome/LoginVoiceWelcome';

export function WelcomeScreen() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-20 sm:py-28">
      <div className="wow-fade-in w-full max-w-lg text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl sm:leading-tight">
          Добро пожаловать в AI Business OS
        </h1>

        <p className="mt-6 text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
          Ваш цифровой штаб для бизнеса.
          <br />
          Одна система для всех ваших направлений, проектов и задач.
        </p>

        <LoginVoiceWelcome />

        <div className="mt-8 flex flex-col items-center gap-4">
          <Link
            href="/login/intro"
            className="inline-flex rounded-xl bg-[var(--accent)] px-8 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)]"
          >
            Начать работу
          </Link>

          <p className="max-w-sm text-xs leading-relaxed text-[var(--text-secondary)]">
            Регистрация понадобится позже, когда вы захотите сохранить результаты.
          </p>
        </div>
      </div>
    </main>
  );
}
