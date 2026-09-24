import { AvatarVideoStudio } from '@/components/platform/AvatarVideoStudio';

type Props = {
  searchParams: Promise<{ mode?: string; project?: string; customAvatar?: string }>;
};

export default async function AvatarVideoPage({ searchParams }: Props) {
  const { mode, project, customAvatar } = await searchParams;
  return (
    <AvatarVideoStudio
      initialMode={mode === 'audio' ? 'audio' : 'text'}
      projectId={project?.trim() || null}
      initialCustomAvatarId={customAvatar?.trim() || ''}
    />
  );
}
