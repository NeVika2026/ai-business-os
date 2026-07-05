export type ExecutiveAttentionPriority = 'high' | 'medium' | 'low';

export type ExecutiveAttentionActionKind =
  | 'reorder_work'
  | 'redistribute_team'
  | 'improve_deliverable'
  | 'request_decision'
  | 'open_workspace';

export type ExecutiveAttentionItem = {
  id: string;
  projectId: string | null;
  projectName: string | null;
  title: string;
  cause: string;
  consequence: string;
  recommendation: string;
  priority: ExecutiveAttentionPriority;
  actionKind: ExecutiveAttentionActionKind;
  href: string | null;
};

export type ExecutiveAttentionSnapshot = {
  items: ExecutiveAttentionItem[];
  scannedAt: string;
};
