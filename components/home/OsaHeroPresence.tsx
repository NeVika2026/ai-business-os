'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react';

import { OrbitMark } from '@/components/brand/OrbitMark';
import { OsaEyes } from '@/components/home/OsaEyes';
import {
  HERO_ORBIT_COUNT,
  HERO_SKIP_TRANSITION_MS,
  type HeroPhase,
  heroPhaseDelay,
} from '@/utils/home/hero-experience';

type OsaHeroPresenceProps = {
  mode?: 'intro' | 'companion';
  lookStraight?: boolean;
  skipIntro?: boolean;
  onReady?: () => void;
};

export type OsaHeroPresenceHandle = {
  skip: () => void;
};

const ORBIT_OFFSETS = [
  { radius: 58, angle: -18 },
  { radius: 52, angle: 112 },
  { radius: 64, angle: 238 },
] as const;

export const OsaHeroPresence = forwardRef<OsaHeroPresenceHandle, OsaHeroPresenceProps>(
  function OsaHeroPresence(
    { mode = 'intro', lookStraight = false, skipIntro = false, onReady },
    ref,
  ) {
    const readyRef = useRef(false);
    const skipRef = useRef(false);
    const [phase, setPhase] = useState<HeroPhase>(mode === 'companion' ? 'ready' : 'orbit-free');
    const [skipped, setSkipped] = useState(false);

    const markReady = useCallback(() => {
      if (readyRef.current) {
        return;
      }

      readyRef.current = true;
      setPhase('ready');
      onReady?.();
    }, [onReady]);

    const skipToReady = useCallback(() => {
      if (readyRef.current || skipRef.current || mode === 'companion') {
        return;
      }

      skipRef.current = true;
      setSkipped(true);
      setPhase('ready');
      window.setTimeout(() => markReady(), HERO_SKIP_TRANSITION_MS);
    }, [markReady, mode]);

    useImperativeHandle(ref, () => ({ skip: skipToReady }), [skipToReady]);

    useEffect(() => {
      if (mode !== 'intro' || skipIntro) {
        return;
      }

      const media = window.matchMedia('(prefers-reduced-motion: reduce)');

      if (media.matches) {
        skipToReady();
      }
    }, [mode, skipIntro, skipToReady]);

    useEffect(() => {
      if (mode === 'companion' || skipIntro) {
        markReady();
      }
    }, [markReady, mode, skipIntro]);

    useEffect(() => {
      if (mode === 'companion' || skipIntro || skipped || phase === 'ready') {
        return;
      }

      const delay = heroPhaseDelay(phase);

      if (delay === null) {
        return;
      }

      const timer = window.setTimeout(() => {
        const next =
          phase === 'eyes-alive'
            ? 'ready'
            : phase === 'orbit-free'
              ? 'orbit-gather'
              : phase === 'orbit-gather'
                ? 'eyes-form'
                : 'eyes-alive';

        setPhase(next);

        if (next === 'ready') {
          markReady();
        }
      }, delay);

      return () => window.clearTimeout(timer);
    }, [markReady, mode, phase, skipIntro, skipped]);

    useEffect(() => {
      if (mode !== 'intro' || skipIntro) {
        return;
      }

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.metaKey || event.ctrlKey || event.altKey) {
          return;
        }

        if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Enter') {
          skipToReady();
        }
      };

      window.addEventListener('keydown', onKeyDown, { passive: true });

      return () => window.removeEventListener('keydown', onKeyDown);
    }, [mode, skipIntro, skipToReady]);

    const showOrbits =
      mode === 'intro' && !skipped && (phase === 'orbit-free' || phase === 'orbit-gather');
    const showEyes =
      mode === 'companion' ||
      skipped ||
      phase === 'eyes-form' ||
      phase === 'eyes-alive' ||
      phase === 'ready';
    const eyesForming = mode === 'intro' && phase === 'eyes-form' && !skipped;
    const eyesAlive =
      mode === 'companion' || skipped || phase === 'eyes-alive' || phase === 'ready';

    return (
      <div
        className={`osa-hero-presence ${skipped ? 'osa-hero-presence--skipped' : ''} osa-hero-presence--${phase}`}
        data-phase={phase}
      >
        <div
          className={`osa-hero-center-light ${
            phase === 'eyes-form' || phase === 'eyes-alive' || phase === 'ready' || skipped
              ? 'osa-hero-center-light--on'
              : ''
          }`}
          aria-hidden="true"
        />

        {showOrbits ? (
          <div
            className={`osa-hero-orbit-field osa-hero-orbit-field--${phase}`}
            aria-hidden="true"
          >
            {Array.from({ length: HERO_ORBIT_COUNT }, (_, index) => {
              const offset = ORBIT_OFFSETS[index] ?? ORBIT_OFFSETS[0];
              const x = Math.cos((offset.angle * Math.PI) / 180) * offset.radius;
              const y = Math.sin((offset.angle * Math.PI) / 180) * offset.radius;

              return (
                <div
                  key={index}
                  className={`osa-hero-orbit osa-hero-orbit--${index}`}
                  style={
                    {
                      '--osa-orbit-x': `${x}px`,
                      '--osa-orbit-y': `${y}px`,
                    } as CSSProperties
                  }
                >
                  <OrbitMark size="sm" breathe={false} className="text-[var(--accent)]" />
                </div>
              );
            })}
          </div>
        ) : null}

        {showEyes ? (
          <div
            className={`osa-hero-eyes ${eyesForming ? 'osa-hero-eyes--forming' : ''} ${eyesAlive ? 'osa-hero-eyes--alive' : ''}`}
          >
            <OsaEyes
              size="md"
              active
              lookStraight={lookStraight}
              skipIntro={skipIntro || mode === 'companion' || skipped}
              introVariant={mode === 'intro' && !skipped ? 'hero' : 'default'}
            />
          </div>
        ) : null}
      </div>
    );
  },
);
