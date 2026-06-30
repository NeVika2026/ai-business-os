import { SignInForm } from '@/components/welcome/SignInForm';

type SignInPageProps = {
  searchParams: Promise<{
    sent?: string;
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
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

  return <SignInForm showSentMessage={showSentMessage} errorMessage={errorMessage} />;
}
