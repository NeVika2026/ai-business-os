import { notFound } from 'next/navigation';

import { ModuleLanding } from '@/components/platform/ModuleLanding';
import {
  getPlatformModule,
  getPlatformTasks,
} from '@/utils/platform/business-zavod-config';

type ModulePageProps = {
  params: Promise<{ module: string }>;
};

export default async function ModulePage({ params }: ModulePageProps) {
  const { module: moduleId } = await params;
  const platformModule = getPlatformModule(moduleId);

  if (!platformModule) {
    notFound();
  }

  return (
    <ModuleLanding
      module={platformModule}
      tasks={getPlatformTasks(platformModule.id)}
    />
  );
}
