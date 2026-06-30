import { FirstResultScreen } from '@/components/welcome/FirstResultScreen';
import { getFirstResult } from '@/lib/login/first-result-store';

type FirstResultPageProps = {
  searchParams: Promise<{
    id?: string;
    error?: string;
  }>;
};

export default async function FirstResultPage({ searchParams }: FirstResultPageProps) {
  const params = await searchParams;
  const plan = getFirstResult(params.id);
  const hasError = params.error === '1';

  return <FirstResultScreen plan={plan} hasError={hasError} />;
}

