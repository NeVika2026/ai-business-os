import type { BuildContextInput, UserProviderResult } from '@/services/runtime/context/types';

export function fetchUser(input: BuildContextInput): UserProviderResult {
  return {
    request: {
      action: input.request.action,
      payload: input.request.payload,
    },
    history: [
      {
        role: 'user',
        content: 'Previous request: review latest CRM leads.',
      },
      {
        role: 'assistant',
        content: 'Prepared a summary of two active leads.',
      },
    ],
  };
}
