'use client';

import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore, useTransition } from 'react';

import { startInvestorDemo } from '@/app/(dashboard)/demo/actions';
import { isDemoModeEnabled, startDemoSession } from '@/utils/demo/osa-demo-mode';

function subscribeToClientMount() {
  return () => {};
}

export function HomeInvestorDemoAction() {
  const router = useRouter();
  const mounted = useSyncExternalStore(subscribeToClientMount, () => true, () => false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!mounted || !isDemoModeEnabled()) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);

          startTransition(async () => {
            const result = await startInvestorDemo();

            if (result.status === 'failed') {
              setError(result.message);
              return;
            }

            startDemoSession(result.projectId);
            router.push(`/workspace/${result.projectId}?demo=1`);
          });
        }}
        className="text-[15px] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:opacity-50"
      >
        {isPending ? 'OSA готовит demo…' : 'Investor Demo'}
      </button>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </>
  );
}
