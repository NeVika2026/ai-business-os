import Link from 'next/link';

import { sendMagicLink } from '@/app/login/actions';

type SignInFormProps = {
  showSentMessage: boolean;
  errorMessage: string | null;
};

export function SignInForm({ showSentMessage, errorMessage }: SignInFormProps) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f7f6f2] px-5 py-8 text-[#17151f] sm:px-8">
      <div className="pointer-events-none absolute -left-20 top-12 h-80 w-80 rounded-full bg-[#d9efff] blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-[#f4d7ff] blur-3xl opacity-55" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[1100px] flex-col">
        <header className="flex items-center justify-between py-2">
          <Link href="/login" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#17151f] text-sm font-bold text-white">
              БЗ
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.16em]">БИЗНЕС ЗАВОД</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-black/40">OSA inside</span>
            </span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-black/45 transition hover:text-black">
            ← На главную
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[.9fr_1.1fr]">
          <div className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6258ff]">
              Рабочее пространство
            </p>
            <h1 className="mt-3 max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em]">
              Возвращайся туда, где AI-команда уже знает контекст.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-black/48">
              Проекты, задачи, память OSA и результаты остаются в одном месте.
            </p>
          </div>

          <div className="mx-auto w-full max-w-md rounded-[32px] border border-black/[0.07] bg-white/82 p-6 shadow-[0_30px_100px_-58px_rgba(55,47,91,.6)] backdrop-blur-xl sm:p-8">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6258ff]">Вход</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Продолжить работу</h2>
              <p className="mt-2 text-sm leading-6 text-black/45">
                Отправим безопасную ссылку на вашу почту. Пароль не нужен.
              </p>
            </div>

            {showSentMessage ? (
              <div className="mb-5 rounded-2xl border border-emerald-500/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Письмо отправлено. Откройте ссылку из почты — и вы войдёте в рабочее пространство.
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mb-5 rounded-2xl border border-red-500/15 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {errorMessage}
              </div>
            ) : null}

            <form action={sendMagicLink} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Email</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@company.com"
                  className="h-12 w-full rounded-2xl border border-black/10 bg-[#fbfaf7] px-4 text-sm outline-none transition placeholder:text-black/30 focus:border-[#6258ff] focus:ring-4 focus:ring-[#6258ff]/10"
                />
              </label>

              <button
                type="submit"
                className="h-12 w-full rounded-2xl bg-[#17151f] px-4 text-sm font-semibold text-white shadow-[0_12px_30px_-18px_rgba(23,21,31,.85)] transition hover:-translate-y-0.5 hover:bg-black"
              >
                Отправить ссылку для входа
              </button>
            </form>

            <div className="mt-6 rounded-2xl bg-[#f4f2fb] px-4 py-3 text-xs leading-5 text-black/45">
              OSA сохранит проекты, результаты и рабочий контекст между сессиями.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
