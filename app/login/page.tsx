import { LoginEntry } from '@/components/welcome/LoginEntry';

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    mode?: string;
  }>;
};

function safeNextPath(value?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const baseNext = safeNextPath(params.next);
  const nextPath =
    baseNext && params.mode && !baseNext.includes('?')
      ? `${baseNext}?mode=${encodeURIComponent(params.mode)}`
      : baseNext;

  return <LoginEntry nextPath={nextPath} />;
}
