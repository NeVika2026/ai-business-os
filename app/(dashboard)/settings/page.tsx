import { PlaceholderPage } from '@/components/layout/placeholder-page';
import { DemoModeToggle } from '@/components/demo/DemoModeToggle';

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PlaceholderPage title="Settings" description="Настройки OSA и режим демонстрации." />
      <div className="mt-8 rounded-[24px] border border-[var(--border-subtle)]/80 bg-white px-6 sm:px-8">
        <DemoModeToggle />
      </div>
    </div>
  );
}
