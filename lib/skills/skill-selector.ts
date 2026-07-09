import type { OsaSkill } from '@/types/skills';
import type { HomeQuickActionId } from '@/utils/home/home-action';
import { classifyRealWorkTaskType } from '@/utils/home/real-work-mode';
import { matchesOsaPattern, normalizeOsaText } from '@/utils/osa/text-matching';

import { getSkillById, OSA_SKILLS } from './skills-registry';

const TASK_TYPE_SKILL_FALLBACK = {
  presentation: 'presentation-create',
  landing: 'landing-create',
  strategy: 'business-strategy',
  analysis: 'market-analysis',
  marketing: 'marketing-campaign',
  content: 'content-plan',
  sales: 'sales-playbook',
} as const;

export function scoreSkillSignals(skill: OsaSkill, haystack: string): number {
  return skill.signals.reduce(
    (score, signal) => score + (matchesOsaPattern(haystack, signal) ? 1 : 0),
    0,
  );
}

export function selectSkillForPrompt(
  prompt: string,
  quickActionId?: HomeQuickActionId,
): OsaSkill {
  const haystack = normalizeOsaText(prompt);
  let best: { skill: OsaSkill; score: number } | null = null;

  for (const skill of OSA_SKILLS) {
    const score = scoreSkillSignals(skill, haystack);

    if (!best || score > best.score) {
      best = { skill, score };
    }
  }

  if (best && best.score > 0) {
    return best.skill;
  }

  const taskType = classifyRealWorkTaskType(prompt, quickActionId);
  const fallbackId = TASK_TYPE_SKILL_FALLBACK[taskType];

  return getSkillById(fallbackId);
}

export function buildSkillModeLabel(skill: OsaSkill): string {
  return `Выбрала режим: ${skill.name}`;
}
