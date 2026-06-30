'use client';

import { VoiceWelcome as VoiceWelcomeControl } from '@/components/voice/VoiceWelcome';
import { HOME_VOICE_WELCOME_TEXT } from '@/utils/voice/voice-welcome';

type HomeVoiceWelcomeProps = {
  className?: string;
};

export function VoiceWelcome({ className }: HomeVoiceWelcomeProps) {
  return <VoiceWelcomeControl welcomeText={HOME_VOICE_WELCOME_TEXT} className={className} />;
}
