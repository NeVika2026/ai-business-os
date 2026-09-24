import { SoundEffectStudio } from '@/components/platform/SoundEffectStudio';

type Props = {
  searchParams: Promise<{ project?: string }>;
};

export default async function SoundEffectsPage({ searchParams }: Props) {
  const { project } = await searchParams;
  return <SoundEffectStudio projectId={project?.trim() || null} />;
}
