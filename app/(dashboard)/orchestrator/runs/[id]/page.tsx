import { permanentRedirect } from 'next/navigation';

type LegacyRunDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacyRunDetailPage({ params }: LegacyRunDetailPageProps) {
  const { id } = await params;
  permanentRedirect(`/results/${id}`);
}
