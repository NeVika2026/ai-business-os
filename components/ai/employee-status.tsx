import type { AiEmployeeStatus } from '@/types/ai';
import { AI_EMPLOYEE_STATUS_LABELS } from '@/types/ai';

const STATUS_STYLES: Record<AiEmployeeStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-300',
  inactive: 'bg-[var(--surface-2)] text-[var(--text-secondary)]',
};

type EmployeeStatusProps = {
  status: AiEmployeeStatus;
  isActive?: boolean;
};

export function EmployeeStatusBadge({ status, isActive = true }: EmployeeStatusProps) {
  const label =
    status === 'active' && isActive
      ? AI_EMPLOYEE_STATUS_LABELS.active
      : AI_EMPLOYEE_STATUS_LABELS.inactive;

  const style = status === 'active' && isActive ? STATUS_STYLES.active : STATUS_STYLES.inactive;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
