
'use client';

import { Player } from '@remotion/player';
import { AbsoluteFill, Audio, Sequence, Video } from 'remotion';

export type StoryboardPreviewScene = {
  id: string;
  title: string;
  durationSeconds: number;
  videoUrl: string;
  narration: string;
};

type StoryboardCompositionProps = {
  scenes: StoryboardPreviewScene[];
  voiceUrl?: string | null;
};

const FPS = 30;

function StoryboardComposition({ scenes, voiceUrl }: StoryboardCompositionProps) {
  const timeline = scenes.map((scene, index) => {
    const durationInFrames = Math.max(1, Math.round(scene.durationSeconds * FPS));
    const from = scenes
      .slice(0, index)
      .reduce(
        (sum, item) => sum + Math.max(1, Math.round(item.durationSeconds * FPS)),
        0,
      );

    return { scene, durationInFrames, from };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070b' }}>
      {timeline.map(({ scene, durationInFrames, from }) => {
        return (
          <Sequence key={scene.id} from={from} durationInFrames={durationInFrames}>
            <AbsoluteFill>
              <Video
                src={scene.videoUrl}
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 54,
                  right: 54,
                  bottom: 78,
                  display: 'flex',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    maxWidth: 900,
                    borderRadius: 28,
                    padding: '20px 28px',
                    background: 'rgba(0,0,0,.68)',
                    color: '#fff',
                    fontSize: 44,
                    fontWeight: 800,
                    lineHeight: 1.15,
                    textShadow: '0 2px 10px rgba(0,0,0,.75)',
                  }}
                >
                  {scene.narration || scene.title}
                </div>
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {voiceUrl ? <Audio src={voiceUrl} /> : null}
    </AbsoluteFill>
  );
}

export function StoryboardRemotionPreview({
  scenes,
  voiceUrl,
}: StoryboardCompositionProps) {
  const safeScenes = scenes.filter((scene) => Boolean(scene.videoUrl));
  const durationInFrames = Math.max(
    FPS,
    safeScenes.reduce(
      (sum, scene) => sum + Math.max(1, Math.round(scene.durationSeconds * FPS)),
      0,
    ),
  );

  if (safeScenes.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-black p-2">
      <Player
        component={StoryboardComposition}
        inputProps={{ scenes: safeScenes, voiceUrl }}
        durationInFrames={durationInFrames}
        compositionWidth={1080}
        compositionHeight={1920}
        fps={FPS}
        controls
        loop
        style={{
          width: '100%',
          aspectRatio: '9 / 16',
          backgroundColor: '#05070b',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
