'use client';

import { WelcomeScreen } from '@/components/welcome/WelcomeScreen';

type LoginEntryProps = {
  nextPath?: string | null;
};

export function LoginEntry({ nextPath = null }: LoginEntryProps) {
  return <WelcomeScreen nextPath={nextPath} />;
}
