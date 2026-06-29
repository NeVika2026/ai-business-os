import { redirect } from 'next/navigation';

import { legacyProjectPath } from '@/utils/navigation/legacy-redirect';

type OsaPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OsaPage({ searchParams }: OsaPageProps) {
  const resolvedSearchParams = await searchParams;
  const projectPath = legacyProjectPath(resolvedSearchParams);

  if (projectPath) {
    redirect(projectPath);
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === 'string') {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
    }
  }

  const query = params.toString();
  redirect(query ? `/workspace?${query}` : '/home');
}
