'use client';

import { useState, useSyncExternalStore } from 'react';

import { OsaFirstContact } from '@/components/first-contact/OsaFirstContact';
import { WelcomeScreen } from '@/components/welcome/WelcomeScreen';
import {
  hasSeenOsaFirstContact,
  prefersReducedMotionFirstContact,
} from '@/utils/first-contact/osa-first-contact';
import { isDemoFirstContactPending, isDemoModeEnabled } from '@/utils/demo/osa-demo-mode';

function subscribeToClientMount() {
  return () => {};
}

export function LoginEntry() {
  const [firstContactComplete, setFirstContactComplete] = useState(false);
  const mounted = useSyncExternalStore(subscribeToClientMount, () => true, () => false);

  if (!mounted) {
    return <div className="osa-fc-screen" aria-hidden="true" />;
  }

  const skipFirstContact =
    !(isDemoModeEnabled() && isDemoFirstContactPending()) &&
    (prefersReducedMotionFirstContact() || hasSeenOsaFirstContact() || firstContactComplete);

  if (skipFirstContact) {
    return (
      <div className="osa-login-enter">
        <WelcomeScreen />
      </div>
    );
  }

  return <OsaFirstContact onComplete={() => setFirstContactComplete(true)} />;
}
