import Link from 'next/link';

import { SignInForm } from '@/components/welcome/SignInForm';

type SignInPageProps = {
  searchParams: Promise<{
    sent?: string;
    error?: string;
    next?: string;
    channel?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  // Preview branches intentionally do not share production authentication keys.
  // Never offer a form that would inevitably throw a server error.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#101114] px-5 text-white">
        <section className="w-full max-w-xl rounded-3xl border border-white/20 bg-[#202126] p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-[#ff964e]">
            Предварительная версия
          </p>
          <h1 className="mt-4 text-3xl font-black">Вход пока не подключён</h1>
          <p className="mt-4 leading-7 text-white/75">
            Это тестовый сайт. Авторизация и регистрация здесь намеренно отключены: у этой версии
            нет отдельной безопасной тестовой базы. Мы не запрашиваем ваши данные и не отправляем
            письма или SMS.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/gotovoe"
              className="rounded-full bg-[#ff7418] px-6 py-3 font-bold text-[#161412]"
            >
              Попробовать бесплатно
            </Link>
            <Link href="/" className="rounded-full border border-white/30 px-6 py-3 font-bold">
              На главную
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const params = await searchParams;
  const showSentMessage = params.sent === '1';
  const channel = params.channel === 'phone' ? 'phone' : 'email';
  const errorMessage =
    params.error === 'invalid_email'
      ? 'Введите корректный email.'
      : params.error === 'send_failed'
        ? 'Не удалось отправить письмо. Попробуйте снова.'
        : params.error === 'invalid_phone'
          ? 'Введите номер телефона в международном формате.'
          : params.error === 'invalid_code'
            ? 'Код неверный или уже истёк. Запросите новый и попробуйте снова.'
            : params.error === 'sms_unavailable'
              ? 'SMS-вход пока недоступен: провайдер SMS не настроен или временно не отвечает.'
              : params.error === 'auth'
                ? 'Не удалось выполнить вход. Попробуйте снова.'
                : null;

  const nextPath =
    params.next && params.next.startsWith('/') && !params.next.startsWith('//')
      ? params.next
      : '/home';

  return (
    <SignInForm
      showSentMessage={showSentMessage}
      errorMessage={errorMessage}
      nextPath={nextPath}
      channel={channel}
    />
  );
}
