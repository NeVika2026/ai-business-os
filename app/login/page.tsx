import { sendMagicLink } from './actions';

type LoginPageProps = {
  searchParams: Promise<{
    sent?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const showSentMessage = params.sent === '1';
  const errorMessage =
    params.error === 'invalid_email'
      ? 'Введите корректный email.'
      : params.error === 'send_failed'
        ? 'Не удалось отправить письмо. Попробуйте снова.'
        : params.error === 'auth'
          ? 'Не удалось выполнить вход. Попробуйте снова.'
          : null;

  return (
    <div
      data-theme="dark"
      className="flex min-h-full flex-col items-center justify-center bg-[var(--surface-0)] px-4 py-12"
    >
      <main className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            AI Business OS
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Войдите по ссылке из письма</p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 shadow-sm">
          {showSentMessage ? (
            <p className="mb-6 text-sm text-[var(--text-primary)]">
              Мы отправили письмо для входа.
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mb-6 text-sm text-red-400" role="alert">
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
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Continue
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
