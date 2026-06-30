import Link from 'next/link';

import { sendMagicLink } from '@/app/login/actions';

type SignInFormProps = {
  showSentMessage: boolean;
  errorMessage: string | null;
};

export function SignInForm({ showSentMessage, errorMessage }: SignInFormProps) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-20 sm:py-28">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Вход в AI Business OS
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            Войдите по ссылке из письма
          </p>
        </div>

        {showSentMessage ? (
          <p className="mb-6 text-center text-sm text-[var(--text-primary)]">
            Мы отправили письмо для входа.
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mb-6 text-center text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <form action={sendMagicLink} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            Продолжить
          </button>
        </form>

        <p className="mt-8 text-center">
          <Link
            href="/login"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            На экран приветствия
          </Link>
        </p>
      </div>
    </main>
  );
}
