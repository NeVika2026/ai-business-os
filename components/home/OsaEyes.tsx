'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type OsaPresenceState =
  | 'idle'
  | 'input-hover'
  | 'input-focus'
  | 'typing'
  | 'quick-action-hover'
  | 'submit';

type OsaEyesProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'overlay';
  active?: boolean;
  /** When true, gaze centers forward and cursor tracking pauses. */
  lookStraight?: boolean;
  /** Skip the intro wink sequence (e.g. during Live Thinking). */
  skipIntro?: boolean;
  /** Hero opening uses a slower, synced wink cadence. */
  introVariant?: 'default' | 'hero';
  /** Fixed gaze target in viewport coordinates (overrides cursor). */
  lookAtPoint?: { x: number; y: number } | null;
  /** Look at a connected element instead of the cursor. */
  gazeTarget?: 'cursor' | 'input' | 'submit' | 'element';
  inputAnchorRef?: React.RefObject<HTMLElement | null>;
  submitAnchorRef?: React.RefObject<HTMLElement | null>;
  /** Arbitrary element to look at (e.g. quick action). */
  lookAtElementRef?: React.RefObject<HTMLElement | null>;
  /** Brief pupil expansion on submit / focus. */
  pupilDilate?: boolean;
  /** Soft eye glow boost (focus / submit). */
  eyeGlow?: boolean;
  /** Slight vertical squint when hovering action buttons. */
  squint?: boolean;
  /** When gazing at input, look slightly lower on focus. */
  inputFocused?: boolean;
  /** Presence mode for idle drift / typing scan. */
  presence?: OsaPresenceState;
  /** Full eye or iris/pupil overlay on hero asset. */
  renderMode?: 'full' | 'overlay';
  onPresenceReady?: () => void;
};

type EyeId = 'left' | 'right';

const SIZE_CLASS: Record<NonNullable<OsaEyesProps['size']>, string> = {
  sm: 'osa-eyes--sm',
  md: 'osa-eyes--md',
  lg: 'osa-eyes--lg',
  xl: 'osa-eyes--xl',
  hero: 'osa-eyes--hero',
  overlay: 'osa-eyes--overlay',
};

const INTRO_WINK_DELAY_MS = 520;
const INTRO_WINK_HOLD_MS = 170;
const INTRO_PAUSE_AFTER_WINK_MS = 780;
const HERO_INTRO_WINK_DELAY_MS = 500;
const GAZE_LERP_ACTIVE = 0.16;
const GAZE_LERP_IDLE = 0.045;
const OVERLAY_GAZE_CLAMP = { x: 4.6, y: 3.4 };
const FULL_GAZE_CLAMP = { x: 7.2, y: 4.8 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Eye({
  id,
  gazeX,
  gazeY,
  blinking,
  winking,
  noticed,
  renderMode,
  pupilDilate,
  squint,
}: {
  id: EyeId;
  gazeX: number;
  gazeY: number;
  blinking: boolean;
  winking: boolean;
  noticed: boolean;
  renderMode: 'full' | 'overlay';
  pupilDilate: boolean;
  squint: boolean;
}) {
  const closed = blinking || (winking && id === 'right');
  const overlay = renderMode === 'overlay';
  const irisScale = overlay ? 0.66 : 0.72;
  const shineScale = overlay ? 0.28 : 0.35;
  const shineSecondaryScale = overlay ? 0.14 : 0.18;

  return (
    <div
      className={`osa-eye osa-eye--${id} ${closed ? 'osa-eye--closed' : ''} ${noticed ? 'osa-eye--noticed' : ''} ${overlay ? 'osa-eye--overlay' : ''} ${squint ? 'osa-eye--squint' : ''}`}
      data-eye={id}
    >
      <div className={`osa-eye-socket ${overlay ? 'osa-eye-socket--overlay' : ''}`}>
        <span
          className="osa-eye-iris"
          style={{
            transform: `translate(calc(-50% + ${gazeX * irisScale}px), calc(-50% + ${gazeY * irisScale}px))`,
          }}
        />
        <span
          className={`osa-eye-pupil ${pupilDilate ? 'osa-eye-pupil--dilate' : ''}`}
          style={{
            transform: `translate(calc(-50% + ${gazeX}px), calc(-50% + ${gazeY}px)) scale(${pupilDilate ? 1.28 : 1})`,
          }}
        />
        <span
          className="osa-eye-shine"
          aria-hidden="true"
          style={{
            transform: `translate(calc(-50% + ${gazeX * shineScale}px), calc(-50% + ${gazeY * shineScale}px))`,
          }}
        />
        {overlay ? (
          <span
            className="osa-eye-shine osa-eye-shine--secondary"
            aria-hidden="true"
            style={{
              transform: `translate(calc(-50% + ${gazeX * shineSecondaryScale}px), calc(-50% + ${gazeY * shineSecondaryScale}px))`,
            }}
          />
        ) : null}
      </div>
      {!overlay ? <span className="osa-eye-lid" aria-hidden="true" /> : null}
      {overlay ? <span className="osa-eye-lid osa-eye-lid--overlay" aria-hidden="true" /> : null}
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
  lookAtPoint = null,
  gazeTarget = 'cursor',
  inputAnchorRef,
  submitAnchorRef,
  lookAtElementRef,
  pupilDilate = false,
  eyeGlow = false,
  squint = false,
  inputFocused = false,
  presence = 'idle',
  renderMode = 'full',
  onPresenceReady,
}: OsaEyesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const presenceReadyRef = useRef(false);
  const pointerActiveRef = useRef(false);
  const idlePhaseRef = useRef(0);
  const typingPhaseRef = useRef(0);
  const reducedMotionRef = useRef(false);
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

  const updateGazeFromPointer = useCallback(
    (clientX: number, clientY: number) => {
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

      const limits = renderMode === 'overlay' ? OVERLAY_GAZE_CLAMP : FULL_GAZE_CLAMP;

      driftTargetRef.current = {
        x: clamp(dx * (6.2 + proximity * 1.4), -limits.x, limits.x),
        y: clamp(dy * (4.2 + proximity * 0.8), -limits.y, limits.y),
      };
    },
    [renderMode],
  );

  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion();

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => {
      reducedMotionRef.current = media.matches;
    };

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!active || lookStraight || reducedMotionRef.current) {
      return;
    }

    if (lookAtPoint || gazeTarget !== 'cursor' || presence !== 'idle') {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      updateGazeFromPointer(event.clientX, event.clientY);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [active, gazeTarget, lookAtPoint, lookStraight, presence, updateGazeFromPointer]);

  useEffect(() => {
    if (!active || lookStraight || !lookAtPoint) {
      return;
    }

    updateGazeFromPointer(lookAtPoint.x, lookAtPoint.y);
  }, [active, lookAtPoint, lookStraight, updateGazeFromPointer]);

  useEffect(() => {
    if (lookStraight) {
      driftTargetRef.current = { x: 0, y: 0 };
      pointerActiveRef.current = false;
      return;
    }

    if (lookAtPoint) {
      pointerActiveRef.current = true;
      return;
    }

    if (gazeTarget !== 'cursor' || presence === 'typing' || presence === 'submit') {
      pointerActiveRef.current = true;
    }
  }, [gazeTarget, lookAtPoint, lookStraight, presence]);

  useEffect(() => {
    if (!active) {
      return;
    }

    let lastIdleTick = performance.now();

    const tick = (now: number) => {
      if (!lookStraight && !lookAtPoint) {
        if (presence === 'typing') {
          typingPhaseRef.current += 0.018;
          const limits = renderMode === 'overlay' ? OVERLAY_GAZE_CLAMP : FULL_GAZE_CLAMP;
          driftTargetRef.current = {
            x: Math.sin(typingPhaseRef.current) * Math.min(3.2, limits.x * 0.7),
            y: 1.2 + Math.sin(typingPhaseRef.current * 0.45) * 0.35,
          };
          pointerActiveRef.current = true;
        } else if (gazeTarget !== 'cursor') {
          const anchor =
            gazeTarget === 'input'
              ? inputAnchorRef?.current
              : gazeTarget === 'submit'
                ? submitAnchorRef?.current
                : gazeTarget === 'element'
                  ? lookAtElementRef?.current
                  : null;

          if (anchor) {
            const rect = anchor.getBoundingClientRect();
            const focusOffsetY =
              gazeTarget === 'input' && inputFocused ? Math.min(rect.height * 0.18, 14) : 0;
            updateGazeFromPointer(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2 + focusOffsetY,
            );
          }
        }
      }

      const current = driftRef.current;
      const target = lookStraight ? { x: 0, y: 0 } : driftTargetRef.current;
      const lerp = lookStraight
        ? 0.22
        : lookAtPoint || gazeTarget !== 'cursor' || presence === 'typing' || pointerActiveRef.current
          ? GAZE_LERP_ACTIVE
          : GAZE_LERP_IDLE;

      if (
        !lookStraight &&
        !lookAtPoint &&
        gazeTarget === 'cursor' &&
        presence === 'idle' &&
        !pointerActiveRef.current &&
        !reducedMotionRef.current &&
        now - lastIdleTick > 2_400
      ) {
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
  }, [
    active,
    gazeTarget,
    inputAnchorRef,
    inputFocused,
    lookAtElementRef,
    lookAtPoint,
    lookStraight,
    presence,
    renderMode,
    submitAnchorRef,
    updateGazeFromPointer,
  ]);

  useEffect(() => {
    if (!active || reducedMotionRef.current) {
      return;
    }

    let blinkTimer: number | undefined;
    let reopenTimer: number | undefined;
    let doubleTimer: number | undefined;

    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(
        () => {
          const doDouble = Math.random() < 0.22;
          setBlinking(true);
          reopenTimer = window.setTimeout(() => {
            setBlinking(false);

            if (doDouble) {
              doubleTimer = window.setTimeout(() => {
                setBlinking(true);
                reopenTimer = window.setTimeout(() => {
                  setBlinking(false);
                  scheduleBlink();
                }, 100);
              }, 140);
              return;
            }

            scheduleBlink();
          }, 120);
        },
        4_000 + Math.random() * 4_000,
      );
    };

    scheduleBlink();

    return () => {
      if (blinkTimer) window.clearTimeout(blinkTimer);
      if (reopenTimer) window.clearTimeout(reopenTimer);
      if (doubleTimer) window.clearTimeout(doubleTimer);
    };
  }, [active]);

  useEffect(() => {
    if (!active || reducedMotionRef.current) {
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
    let readyTimer: number | undefined;

    const winkStartTimer = window.setTimeout(() => {
      setWinking(true);
      winkEndTimer = window.setTimeout(() => {
        setWinking(false);
        readyTimer = window.setTimeout(() => markPresenceReady(), INTRO_PAUSE_AFTER_WINK_MS);
      }, INTRO_WINK_HOLD_MS);
    }, HERO_INTRO_WINK_DELAY_MS);

    return () => {
      if (winkStartTimer) window.clearTimeout(winkStartTimer);
      if (winkEndTimer) window.clearTimeout(winkEndTimer);
      if (readyTimer) window.clearTimeout(readyTimer);
    };
  }, [active, introVariant, markPresenceReady, skipIntro]);

  return (
    <div
      ref={rootRef}
      className={`osa-eyes ${SIZE_CLASS[size]} ${renderMode === 'overlay' ? 'osa-eyes--overlay-mode' : ''} ${noticed ? 'osa-eyes--noticed' : ''} ${eyeGlow ? 'osa-eyes--glow' : ''} ${className}`.trim()}
      role="img"
      aria-label="OSA"
      data-presence={presence}
    >
      <Eye
        id="left"
        gazeX={gaze.x}
        gazeY={gaze.y}
        blinking={blinking}
        winking={winking}
        noticed={noticed}
        renderMode={renderMode}
        pupilDilate={pupilDilate}
        squint={squint}
      />
      <Eye
        id="right"
        gazeX={gaze.x * 0.94}
        gazeY={gaze.y * 0.94}
        blinking={blinking}
        winking={winking}
        noticed={noticed}
        renderMode={renderMode}
        pupilDilate={pupilDilate}
        squint={squint}
      />
    </div>
  );
}
