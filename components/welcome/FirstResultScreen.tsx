import Link from 'next/link';

export function FirstResultScreen() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-20 sm:py-28">
      <div className="wow-fade-in w-full max-w-lg text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Первый результат готов
        </h1>

        <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)]">
          Мы подготовили черновик решения. Чтобы сохранить его и продолжить работу завтра, создайте
          аккаунт.
        </p>

        <div className="mt-12">
          <Link
            href="/login/sign-in"
            className="inline-flex rounded-xl bg-[var(--accent)] px-8 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)]"
          >
            Сохранить результат
          </Link>
        </div>
      </div>
    </main>
  );
}
