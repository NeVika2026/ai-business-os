'use client';

import { useFormStatus } from 'react-dom';

import { executeAgent } from '@/app/(dashboard)/orchestrator/actions';

type ExecuteButtonProps = {
  aiEmployeeId: string;
  disabled?: boolean;
};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      {pending ? 'Выполняется…' : '▶ Execute'}
    </button>
  );
}

export function ExecuteButton({ aiEmployeeId, disabled = false }: ExecuteButtonProps) {
  return (
    <form action={executeAgent}>
      <input type="hidden" name="ai_employee_id" value={aiEmployeeId} />
      <SubmitButton disabled={disabled} />
    </form>
  );
}
