import { ProductUgcStudio } from '@/components/platform/ProductUgcStudio';

type ProductUgcPageProps = {
  searchParams: Promise<{ project?: string }>;
};

export default async function ProductUgcPage({ searchParams }: ProductUgcPageProps) {
  const { project } = await searchParams;
  return <ProductUgcStudio projectId={project?.trim() || null} />;
}
