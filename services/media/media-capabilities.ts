import { hasElevenLabsProvider } from '@/services/media/elevenlabs-client';
import { hasRunwayMediaProvider } from '@/services/media/runway-client';

export type MediaCapabilities = {
  video: boolean;
  image: boolean;
  voice: boolean;
  captions: boolean;
  montage: boolean;
};

export function resolveMediaCapabilities(): MediaCapabilities {
  const runway = hasRunwayMediaProvider();

  return {
    video: runway,
    image: runway,
    voice: hasElevenLabsProvider(),
    captions: true,
    montage: false,
  };
}
