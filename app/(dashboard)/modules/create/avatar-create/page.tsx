import { CustomAvatarStudio } from '@/components/platform/CustomAvatarStudio';

type Props = {
  searchParams: Promise<{ project?: string }>;
};

export default async function CustomAvatarPage({ searchParams }: Props) {
  const { project } = await searchParams;
  return <CustomAvatarStudio projectId={project?.trim() || null} />;
}
