'use client';

import { VoiceWelcome } from '@/components/voice/VoiceWelcome';
import { LOGIN_VOICE_WELCOME_TEXT } from '@/utils/voice/voice-welcome';

export function LoginVoiceWelcome() {
  return <VoiceWelcome welcomeText={LOGIN_VOICE_WELCOME_TEXT} className="mt-6" />;
}
