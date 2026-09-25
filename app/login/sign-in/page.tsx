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
