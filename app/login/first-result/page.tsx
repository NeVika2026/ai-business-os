import { FirstResultScreen } from '@/components/welcome/FirstResultScreen';
import { buildFirstResultFallbackPlan } from '@/lib/login/first-result-plan';
import { getFirstResultEntry } from '@/lib/login/first-result-store';

type FirstResultPageProps = {
  searchParams: Promise<{
    id?: string;
    error?: string;
  }>;
};

export default async function FirstResultPage({ searchParams }: FirstResultPageProps) {
  const params = await searchParams;
  const entry = getFirstResultEntry(params.id);
  const content =
    entry?.content?.trim() ||
    (entry?.task ? buildFirstResultFallbackPlan(entry.task) : null);

  return (
    <FirstResultScreen
      entry={
        content
          ? {
              task: entry?.task ?? '',
              content,
              usedFallback: entry?.usedFallback ?? (entry?.content ? undefined : true),
              failureReason: entry?.failureReason,
            }
          : null
      }
    />
  );
}
