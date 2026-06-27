import type { ContextBudget } from '@/services/runtime/context/budget';
import type { CrmProviderResult } from '@/services/runtime/context/types';
import { mockScore, rankByScore } from '@/services/runtime/context/ranking';

export type SelectedCrmLead = CrmProviderResult['leads'][number] & {
  score: number;
};

export function selectCrmLeads(crm: CrmProviderResult, budget: ContextBudget): SelectedCrmLead[] {
  const ranked = rankByScore(crm.leads, (lead) =>
    mockScore(`${lead.id}:${lead.status}:${lead.name}`),
  );

  return ranked.slice(0, budget.crmItems);
}
