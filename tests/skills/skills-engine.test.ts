import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetExecutiveState } from '@/lib/executive/executive-state';
import { resolveDeliverableTypeForAgent } from '@/lib/skills/skill-deliverables';
import { clearSkillNamespace, saveProjectSkill } from '@/lib/skills/skill-storage';
import { buildSkillModeLabel, selectSkillForPrompt } from '@/lib/skills/skill-selector';
import { specialistsFromSkill } from '@/lib/skills/skill-specialists';
import { getSkillById } from '@/lib/skills/skills-registry';
import { resetMemoryStore } from '@/lib/memory/memory-engine';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import type { DeliverableType } from '@/types/deliverables';

describe('skills engine', () => {
  beforeEach(() => {
    resetMemoryStore();
    resetProjectRuntimeStore();
    resetExecutiveState();
    clearSkillNamespace(getRuntimeStorage());
  });

  it('selects estate analysis for real estate prompts', () => {
    const skill = selectSkillForPrompt('Помоги с анализом новостроек и объектов недвижимости');

    assert.equal(skill.id, 'estate-analysis');
    assert.equal(buildSkillModeLabel(skill), 'Выбрала режим: Анализ недвижимости');
  });

  it('selects presentation skill for deck prompts', () => {
    const skill = selectSkillForPrompt('Нужна презентация для инвесторов');

    assert.equal(skill.id, 'presentation-create');
    assert.match(buildSkillModeLabel(skill), /презентац/i);
  });

  it('maps skill team to orchestra specialists', () => {
    const skill = getSkillById('presentation-create');
    const team = specialistsFromSkill(skill);

    assert.equal(team.length, 3);
    assert.equal(team[0]?.id, 'business-manager');
    assert.equal(team[1]?.id, 'project-manager');
    assert.equal(team[2]?.id, 'content');
  });

  it('assigns deliverables from selected skill', () => {
    const storage = getRuntimeStorage();
    saveProjectSkill(storage, 'project-skill-1', 'landing-create');

    const used = new Set<DeliverableType>();
    const first = resolveDeliverableTypeForAgent({
      projectId: 'project-skill-1',
      agentId: 'business-manager',
      agentIndex: 0,
      usedTypes: used,
    });
    const second = resolveDeliverableTypeForAgent({
      projectId: 'project-skill-1',
      agentId: 'marketing',
      agentIndex: 1,
      usedTypes: used,
    });
    const third = resolveDeliverableTypeForAgent({
      projectId: 'project-skill-1',
      agentId: 'content',
      agentIndex: 2,
      usedTypes: used,
    });

    assert.equal(first, 'business_strategy');
    assert.equal(second, 'landing');
    assert.equal(third, 'content_plan');
  });
});
