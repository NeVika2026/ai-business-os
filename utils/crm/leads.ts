import type { CrmLead, LeadStatus } from '@/types/crm';

type RawLeadRow = {
  id: string;
  organization_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  source: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  assignee: { full_name: string | null } | { full_name: string | null }[] | null;
};

export function mapCrmLeads(rows: RawLeadRow[]): CrmLead[] {
  return rows.map((row) => ({
    ...row,
    assignee: Array.isArray(row.assignee) ? (row.assignee[0] ?? null) : row.assignee,
  }));
}
