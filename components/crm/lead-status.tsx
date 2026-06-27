import type { LeadStatus } from '@/types/crm';
import { LEAD_STATUS_LABELS } from '@/types/crm';

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  contacted: 'bg-amber-500/15 text-amber-300',
  qualified: 'bg-violet-500/15 text-violet-300',
  won: 'bg-emerald-500/15 text-emerald-300',
  lost: 'bg-red-500/15 text-red-300',
};

type LeadStatusBadgeProps = {
  status: LeadStatus;
};

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}
