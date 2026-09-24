import { MusicStudio } from '@/components/platform/MusicStudio';

type Props = {
  searchParams: Promise<{ project?: string }>;
};

export default async function MusicPage({ searchParams }: Props) {
  const { project } = await searchParams;
  return <MusicStudio projectId={project?.trim() || null} />;
}
