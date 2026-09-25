import Link from 'next/link';

import {
  sendMagicLink,
  sendPhoneOtp,
  verifyEmailOtp,
  verifyPhoneOtp,
} from '@/app/login/actions';

type SignInFormProps = {
  showSentMessage: boolean;
  errorMessage: string | null;
  nextPath: string;
  channel: 'email' | 'phone';
};

function channelHref(channel: 'email' | 'phone', nextPath: string) {
  return '/login/sign-in?channel=' + channel + '&next=' + encodeURIComponent(nextPath);
}

export function SignInForm({
  showSentMessage,
  errorMessage,
  nextPath,
  channel,
}: SignInFormProps) {
  const isPhone = channel === 'phone';

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#05070b] px-5 py-6 text-[#fff8e7] sm:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:radial-gradient(circle_at_50%_40%,#000,transparent_78%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-96 w-96 rounded-full bg-[#69e4ee]/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-12 h-[440px] w-[440px] rounded-full bg-[#f1c96c]/[0.08] blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-[1180px] flex-col">
        <header className="flex items-center justify-between border-b border-white/[0.06] py-4">
          <Link href="/login" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#f1c96c]/22 bg-white/[0.03] text-[13px] font-black tracking-[.06em] text-[#f4d16c]">
              БЗ
            </span>
            <span>
              <span className="block text-[14px] font-black tracking-[0.16em]">БИЗНЕС ЗАВОД</span>
              <span className="block text-[11px] uppercase tracking-[0.16em] text-white/58">
                AI-СИСТЕМА ДЛЯ РАБОТЫ
              </span>
            </span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-white/62 transition hover:text-white">
            ← На входной экран
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_.85fr]">
          <div className="hidden lg:block">
            <p className="text-[12px] font-black uppercase tracking-[.18em] text-[#87eef5]">
              ЗАЩИЩЁННАЯ ЗОНА
            </p>
            <h1 className="mt-4 max-w-2xl text-6xl font-semibold leading-[.92] tracking-[-.06em]">
              Вернуться
              <span className="block text-white/58">в свой завод.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/68">
              Проекты, медиа, рабочая память, результаты и контекст команды сохраняются между входами.
            </p>

            <div className="mt-8 grid max-w-lg grid-cols-3 gap-2">
              {[
                ['ПРОЕКТЫ', 'ГОТОВО'],
                ['ПАМЯТЬ', 'ВКЛ'],
                ['ОРКЕСТР', 'ГОТОВ'],
              ].map(([label, status]) => (
                <div key={label} className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] px-3 py-3">
                  <p className="text-[11px] tracking-[.12em] text-white/60">{label}</p>
                  <p className="mt-2 text-[12px] font-bold text-emerald-200/88">{status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/[0.08] bg-[#0a0e15]/86 p-6 shadow-[0_35px_110px_-58px_rgba(0,0,0,.95)] backdrop-blur-2xl sm:p-8">
            <div className="mb-6">
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#f4d16c]">
                Вход в систему
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                Продолжить производство
              </h2>
              <p className="mt-2 text-base leading-7 text-white/68">
                Пароль не нужен. Используйте email или телефон и одноразовый код.
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.06] bg-black/20 p-1.5">
              <Link
                href={channelHref('email', nextPath)}
                className={
                  'rounded-xl px-3 py-2.5 text-center text-sm font-black transition ' +
                  (!isPhone ? 'bg-[#69e4ee]/10 text-[#bff7fa]' : 'text-white/48 hover:text-white')
                }
              >
                Email
              </Link>
              <Link
                href={channelHref('phone', nextPath)}
                className={
                  'rounded-xl px-3 py-2.5 text-center text-sm font-black transition ' +
                  (isPhone ? 'bg-[#69e4ee]/10 text-[#bff7fa]' : 'text-white/48 hover:text-white')
                }
              >
                Телефон
              </Link>
            </div>

            {showSentMessage ? (
              <div className="mb-5 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.04] px-4 py-3 text-sm leading-6 text-emerald-100/76">
                {isPhone
                  ? 'SMS отправлено. Введите номер телефона и код из сообщения ниже.'
                  : 'Письмо отправлено. Можно открыть ссылку из письма или ввести email и код ниже.'}
              </div>
            ) : null}

            {errorMessage ? (
              <div
                className="mb-5 rounded-2xl border border-red-300/10 bg-red-300/[0.04] px-4 py-3 text-sm leading-6 text-red-100/76"
                role="alert"
              >
                {errorMessage}
              </div>
            ) : null}

            {!showSentMessage ? (
              <form action={isPhone ? sendPhoneOtp : sendMagicLink} className="space-y-4">
                <input type="hidden" name="next" value={nextPath} />

                {isPhone ? (
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[.11em] text-white/68">
                      Номер телефона
                    </span>
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      placeholder="+7 999 123-45-67"
                      className="h-12 w-full rounded-[16px] border border-white/[0.08] bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/38 focus:border-[#69e4ee]/35 focus:ring-4 focus:ring-[#69e4ee]/[0.04]"
                    />
                  </label>
                ) : (
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[.11em] text-white/68">
                      Email
                    </span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@company.com"
                      className="h-12 w-full rounded-[16px] border border-white/[0.08] bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/38 focus:border-[#69e4ee]/35 focus:ring-4 focus:ring-[#69e4ee]/[0.04]"
                    />
                  </label>
                )}

                <button
                  type="submit"
                  className="h-12 w-full rounded-[16px] bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-4 text-sm font-extrabold text-[#181006] shadow-[0_16px_34px_-18px_rgba(241,201,108,.55)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  {isPhone ? 'Получить SMS-код →' : 'Получить код / ссылку →'}
                </button>
              </form>
            ) : (
              <form action={isPhone ? verifyPhoneOtp : verifyEmailOtp} className="space-y-4">
                <input type="hidden" name="next" value={nextPath} />

                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold uppercase tracking-[.11em] text-white/68">
                    {isPhone ? 'Номер телефона' : 'Email'}
                  </span>
                  <input
                    name={isPhone ? 'phone' : 'email'}
                    type={isPhone ? 'tel' : 'email'}
                    autoComplete={isPhone ? 'tel' : 'email'}
                    inputMode={isPhone ? 'tel' : 'email'}
                    required
                    placeholder={isPhone ? '+7 999 123-45-67' : 'you@company.com'}
                    className="h-12 w-full rounded-[16px] border border-white/[0.08] bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/38 focus:border-[#69e4ee]/35"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold uppercase tracking-[.11em] text-white/68">
                    Одноразовый код
                  </span>
                  <input
                    name="token"
                    type="text"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]{6,8}"
                    maxLength={8}
                    required
                    placeholder="123456"
                    className="h-14 w-full rounded-[16px] border border-[#69e4ee]/18 bg-black/25 px-4 text-center text-xl font-black tracking-[.28em] text-white outline-none focus:border-[#69e4ee]/40"
                  />
                </label>

                <button
                  type="submit"
                  className="h-12 w-full rounded-[16px] bg-[linear-gradient(135deg,#f2d474,#c68a26)] px-4 text-sm font-extrabold text-[#181006]"
                >
                  Войти по коду →
                </button>

                <Link
                  href={channelHref(channel, nextPath)}
                  className="block text-center text-xs font-bold text-white/48 hover:text-white/70"
                >
                  Получить новый код
                </Link>
              </form>
            )}

            <div className="mt-6 flex items-center justify-between rounded-[16px] border border-white/[0.055] bg-white/[0.02] px-4 py-3 text-[12px] text-white/58">
              <span>СЕССИЯ</span>
              <span className="text-emerald-200/82">● ЗАЩИЩЕНО</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
