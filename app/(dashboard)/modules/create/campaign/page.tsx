import { CampaignFactoryStudio } from '@/components/platform/CampaignFactoryStudio';
import type { CampaignRecipeKind } from '@/app/(dashboard)/modules/create/studio/actions';

type CampaignPageProps = {
  searchParams: Promise<{ project?: string; kind?: string }>;
};

const KINDS = new Set<CampaignRecipeKind>([
  'product_ad',
  'product_ugc',
  'product_campaign',
  'ad_localization',
  'multi_shot',
]);

export default async function CampaignPage({ searchParams }: CampaignPageProps) {
  const { project, kind } = await searchParams;
  const initialKind = KINDS.has(kind as CampaignRecipeKind)
    ? (kind as CampaignRecipeKind)
    : 'product_ad';

  return (
    <CampaignFactoryStudio
      projectId={project?.trim() || null}
      initialKind={initialKind}
    />
  );
}
