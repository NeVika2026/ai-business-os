import type { ProjectSkillSelection, OsaSkillId } from '@/types/skills';

import type { RuntimeStorage } from '@/lib/storage/runtime-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';

import { getSkillById } from './skills-registry';

const NAMESPACE = 'project:skill';

export function saveProjectSkill(
  storage: RuntimeStorage,
  projectId: string,
  skillId: OsaSkillId,
): ProjectSkillSelection {
  const skill = getSkillById(skillId);
  const selection: ProjectSkillSelection = {
    projectId,
    skillId: skill.id,
    skillName: skill.name,
    selectedAt: new Date().toISOString(),
  };

  storage.save(NAMESPACE, projectId, selection);

  return selection;
}

export function loadProjectSkill(projectId: string): ProjectSkillSelection | null {
  return getRuntimeStorage().load<ProjectSkillSelection>(NAMESPACE, projectId);
}

export function loadProjectSkillDeliverables(projectId: string) {
  const selection = loadProjectSkill(projectId);

  if (!selection) {
    return null;
  }

  return getSkillById(selection.skillId).deliverables;
}

export function clearSkillNamespace(storage: RuntimeStorage): void {
  storage.clear(NAMESPACE);
}
