import Link from 'next/link';

import { sendMagicLink } from '@/app/login/actions';

type SignInFormProps = {
  showSentMessage: boolean;
  errorMessage: string | null;
};

export function SignInForm({ showSentMessage, errorMessage }: SignInFormProps) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#05070b] px-5 py-6 text-[#fff8e7] sm:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:radial-gradient(circle_at_50%_40%,#000,transparent_78%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-96 w-96 rounded-full bg-[#69e4ee]/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-12 h-[440px] w-[440px] rounded-full bg-[#f1c96c]/[0.08] blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-[1180px] flex-col">
        <header className="flex items-center justify-between border-b border-white/[0.06] py-4">
          <Link href="/login" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#f1c96c]/22 bg-white/[0.03] text-[11px] font-black tracking-[.08em] text-[#f1c96c]">
              БЗ
            </span>
            <span>
              <span className="block text-[12px] font-black tracking-[0.22em]">БИЗНЕС ЗАВОД</span>
              <span className="block text-[9px] uppercase tracking-[0.2em] text-white/25">OSA OPERATING SYSTEM</span>
            </span>
          </Link>
          <Link href="/login" className="text-xs font-medium text-white/30 transition hover:text-white">
            ← На входной экран
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_.85fr]">
          <div className="hidden lg:block">
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#69e4ee]">AUTHORIZED ZONE</p>
            <h1 className="mt-4 max-w-2xl text-6xl font-semibold leading-[.92] tracking-[-.06em]">
              Вернуться
              <span className="block text-white/28">в свой завод.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/34">
              Здесь уже лежат проекты, медиа, рабочая память OSA, результаты и контекст команды.
            </p>

            <div className="mt-8 grid max-w-lg grid-cols-3 gap-2">
              {[
                ['PROJECTS', 'ON'],
                ['MEMORY', 'ON'],
                ['ORCHESTRA', 'READY'],
              ].map(([label, status]) => (
                <div key={label} className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] px-3 py-3">
                  <p className="text-[9px] tracking-[.14em] text-white/24">{label}</p>
                  <p className="mt-2 text-[10px] font-bold text-emerald-200/60">{status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/[0.08] bg-[#0a0e15]/86 p-6 shadow-[0_35px_110px_-58px_rgba(0,0,0,.95)] backdrop-blur-2xl sm:p-8">
            <div className="mb-7">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f1c96c]">Вход в систему</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Продолжить производство</h2>
              <p className="mt-2 text-sm leading-6 text-white/32">
                Пришлём безопасную ссылку на почту. Пароль не нужен.
              </p>
            </div>

            {showSentMessage ? (
              <div className="mb-5 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.04] px-4 py-3 text-sm text-emerald-100/70">
                Письмо отправлено. Откройте ссылку — и система вернёт вас в рабочее пространство.
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mb-5 rounded-2xl border border-red-300/10 bg-red-300/[0.04] px-4 py-3 text-sm text-red-100/70" role="alert">
                {errorMessage}
              </div>
            ) : null}

            <form action={sendMagicLink} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[.13em] text-white/34">
                  Email
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@company.com"
                  className="h-12 w-full rounded-[16px] border border-white/[0.08] bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/18 focus:border-[#69e4ee]/35 focus:ring-4 focus:ring-[#69e4ee]/[0.04]"
                />
              </label>

              <button
                type="submit"
                className="h-12 w-full rounded-[16px] bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-4 text-sm font-extrabold text-[#181006] shadow-[0_16px_34px_-18px_rgba(241,201,108,.55)] transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Получить ссылку для входа →
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between rounded-[16px] border border-white/[0.055] bg-white/[0.02] px-4 py-3 text-[10px] text-white/24">
              <span>OSA SESSION</span>
              <span className="text-emerald-200/55">● SECURE</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
