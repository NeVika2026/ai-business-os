export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type CrmLead = {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  source: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  assignee: {
    full_name: string | null;
  } | null;
};

export type LeadFormValues = {
  name: string;
  phone: string;
  email: string;
  source: string;
  notes: string;
  status: LeadStatus;
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};
