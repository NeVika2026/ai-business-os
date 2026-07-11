'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type OsaEyesProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  /** When true, gaze centers forward and cursor tracking pauses. */
  lookStraight?: boolean;
  /** Skip the intro wink sequence (e.g. during Live Thinking). */
  skipIntro?: boolean;
  /** Hero opening uses a slower, synced wink cadence. */
  introVariant?: 'default' | 'hero';
  onPresenceReady?: () => void;
};

type EyeId = 'left' | 'right';

const SIZE_CLASS: Record<NonNullable<OsaEyesProps['size']>, string> = {
  sm: 'osa-eyes--sm',
  md: 'osa-eyes--md',
  lg: 'osa-eyes--lg',
};

const INTRO_WINK_DELAY_MS = 520;
const INTRO_WINK_HOLD_MS = 170;
const INTRO_PAUSE_AFTER_WINK_MS = 780;
const HERO_INTRO_WINK_DELAY_MS = 500;
const GAZE_LERP_ACTIVE = 0.16;
const GAZE_LERP_IDLE = 0.045;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function Eye({
  id,
  gazeX,
  gazeY,
  blinking,
  winking,
  noticed,
}: {
  id: EyeId;
  gazeX: number;
  gazeY: number;
  blinking: boolean;
  winking: boolean;
  noticed: boolean;
}) {
  const closed = blinking || (winking && id === 'right');

  return (
    <div
      className={`osa-eye ${closed ? 'osa-eye--closed' : ''} ${noticed ? 'osa-eye--noticed' : ''}`}
      data-eye={id}
    >
      <div className="osa-eye-socket">
        <span
          className="osa-eye-iris"
          style={{
            transform: `translate(calc(-50% + ${gazeX * 0.72}px), calc(-50% + ${gazeY * 0.72}px))`,
          }}
        />
        <span
          className="osa-eye-pupil"
          style={{
            transform: `translate(calc(-50% + ${gazeX}px), calc(-50% + ${gazeY}px))`,
          }}
        />
        <span className="osa-eye-shine" aria-hidden="true" />
      </div>
      <span className="osa-eye-lid" aria-hidden="true" />
    </div>
  );
}

export function OsaEyes({
  className = '',
  size = 'md',
  active = true,
  lookStraight = false,
  skipIntro = false,
  introVariant = 'default',
  onPresenceReady,
}: OsaEyesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const presenceReadyRef = useRef(false);
  const pointerActiveRef = useRef(false);
  const idlePhaseRef = useRef(0);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const [winking, setWinking] = useState(false);
  const [noticed, setNoticed] = useState(false);
  const driftRef = useRef({ x: 0, y: 0 });
  const driftTargetRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  const markPresenceReady = useCallback(() => {
    if (presenceReadyRef.current) {
      return;
    }

    presenceReadyRef.current = true;
    onPresenceReady?.();
  }, [onPresenceReady]);

  const updateGazeFromPointer = useCallback((clientX: number, clientY: number) => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    if (!pointerActiveRef.current) {
      pointerActiveRef.current = true;
      setNoticed(true);
      window.setTimeout(() => setNoticed(false), 520);
    }

    const rect = root.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (clientX - centerX) / Math.max(window.innerWidth * 0.34, 1);
    const dy = (clientY - centerY) / Math.max(window.innerHeight * 0.32, 1);
    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    const proximity = clamp(1 - distance / Math.max(window.innerWidth * 0.55, 1), 0, 1);

    driftTargetRef.current = {
      x: clamp(dx * (6.2 + proximity * 1.4), -7.2, 7.2),
      y: clamp(dy * (4.2 + proximity * 0.8), -4.8, 4.8),
    };
  }, []);

  useEffect(() => {
    if (!active || lookStraight) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      updateGazeFromPointer(event.clientX, event.clientY);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [active, lookStraight, updateGazeFromPointer]);

  useEffect(() => {
    if (lookStraight) {
      driftTargetRef.current = { x: 0, y: 0 };
      pointerActiveRef.current = false;
    }
  }, [lookStraight]);

  useEffect(() => {
    if (!active) {
      return;
    }

    let lastIdleTick = performance.now();

    const tick = (now: number) => {
      const current = driftRef.current;
      const target = lookStraight ? { x: 0, y: 0 } : driftTargetRef.current;
      const lerp = lookStraight
        ? 0.22
        : pointerActiveRef.current
          ? GAZE_LERP_ACTIVE
          : GAZE_LERP_IDLE;

      if (!lookStraight && !pointerActiveRef.current && now - lastIdleTick > 2_400) {
        idlePhaseRef.current += 0.012;
        driftTargetRef.current = {
          x: Math.sin(idlePhaseRef.current) * 1.4,
          y: Math.cos(idlePhaseRef.current * 0.85) * 0.7,
        };
        lastIdleTick = now;
      }

      const nextX = current.x + (target.x - current.x) * lerp;
      const nextY = current.y + (target.y - current.y) * lerp;

      driftRef.current = { x: nextX, y: nextY };
      setGaze({ x: nextX, y: nextY });
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [active, lookStraight]);

  useEffect(() => {
    if (!active) {
      return;
    }

    let blinkTimer: number | undefined;
    let reopenTimer: number | undefined;

    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(
        () => {
          setBlinking(true);
          reopenTimer = window.setTimeout(() => {
            setBlinking(false);
            scheduleBlink();
          }, 120);
        },
        3_200 + Math.random() * 3_800,
      );
    };

    scheduleBlink();

    return () => {
      if (blinkTimer) window.clearTimeout(blinkTimer);
      if (reopenTimer) window.clearTimeout(reopenTimer);
    };
  }, [active]);

  useEffect(() => {
    if (!active) {
      return;
    }

    let winkTimer: number | undefined;
    let winkEndTimer: number | undefined;

    const scheduleWink = () => {
      winkTimer = window.setTimeout(
        () => {
          setWinking(true);
          winkEndTimer = window.setTimeout(() => {
            setWinking(false);
            scheduleWink();
          }, 165);
        },
        14_000 + Math.random() * 12_000,
      );
    };

    scheduleWink();

    return () => {
      if (winkTimer) window.clearTimeout(winkTimer);
      if (winkEndTimer) window.clearTimeout(winkEndTimer);
    };
  }, [active]);

  useEffect(() => {
    if (!active || skipIntro || introVariant === 'hero') {
      if (skipIntro) {
        markPresenceReady();
      }
      return;
    }

    let winkEndTimer: number | undefined;
    let pauseTimer: number | undefined;

    const winkStartTimer = window.setTimeout(() => {
      setWinking(true);
      winkEndTimer = window.setTimeout(() => {
        setWinking(false);
        pauseTimer = window.setTimeout(() => markPresenceReady(), INTRO_PAUSE_AFTER_WINK_MS);
      }, INTRO_WINK_HOLD_MS);
    }, INTRO_WINK_DELAY_MS);

    return () => {
      if (winkStartTimer) window.clearTimeout(winkStartTimer);
      if (winkEndTimer) window.clearTimeout(winkEndTimer);
      if (pauseTimer) window.clearTimeout(pauseTimer);
    };
  }, [active, introVariant, markPresenceReady, skipIntro]);

  useEffect(() => {
    if (!active || skipIntro || introVariant !== 'hero') {
      return;
    }

    let winkEndTimer: number | undefined;

    const winkStartTimer = window.setTimeout(() => {
      setWinking(true);
      winkEndTimer = window.setTimeout(() => setWinking(false), INTRO_WINK_HOLD_MS);
    }, HERO_INTRO_WINK_DELAY_MS);

    return () => {
      if (winkStartTimer) window.clearTimeout(winkStartTimer);
      if (winkEndTimer) window.clearTimeout(winkEndTimer);
    };
  }, [active, introVariant, skipIntro]);

  return (
    <div
      ref={rootRef}
      className={`osa-eyes ${SIZE_CLASS[size]} ${noticed ? 'osa-eyes--noticed' : ''} ${className}`.trim()}
      role="img"
      aria-label="OSA"
    >
      <Eye id="left" gazeX={gaze.x} gazeY={gaze.y} blinking={blinking} winking={winking} noticed={noticed} />
      <Eye
        id="right"
        gazeX={gaze.x * 0.94}
        gazeY={gaze.y * 0.94}
        blinking={blinking}
        winking={winking}
        noticed={noticed}
      />
    </div>
  );
}
