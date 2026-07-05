'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { OrbitMark } from '@/components/brand/OrbitMark';
import {
  markOsaFirstContactSeen,
  OSA_FIRST_CONTACT_CLOSING_HOLD_MS,
  OSA_FIRST_CONTACT_CLOSING_SILENCE_MS,
  OSA_FIRST_CONTACT_CLOSING_TAGLINE,
  OSA_FIRST_CONTACT_FINAL_DISSOLVE_MS,
  OSA_FIRST_CONTACT_LINE_DISSOLVE_MS,
  OSA_FIRST_CONTACT_LINE_ENTER_MS,
  OSA_FIRST_CONTACT_LINE_GAP_MS,
  OSA_FIRST_CONTACT_LINE_HOLD_MS,
  OSA_FIRST_CONTACT_OPENING_LINES,
  OSA_FIRST_CONTACT_OPENING_SILENCE_MS,
  OSA_FIRST_CONTACT_ORBIT_BIRTH_MS,
  OSA_FIRST_CONTACT_ORBIT_LINE_DISSOLVE_MS,
  OSA_FIRST_CONTACT_ORBIT_LINE_ENTER_MS,
  OSA_FIRST_CONTACT_ORBIT_LINE_HOLD_MS,
  OSA_FIRST_CONTACT_ORBIT_LINES,
  OSA_FIRST_CONTACT_OSA_WORD_ENTER_MS,
  OSA_FIRST_CONTACT_POST_SONIC_MS,
  OSA_FIRST_CONTACT_TAGLINE_ENTER_MS,
} from '@/utils/first-contact/osa-first-contact';
import { playOsaSonicLogo, stopOsaFirstContactAudio } from '@/utils/first-contact/osa-first-contact-audio';

type OsaFirstContactProps = {
  onComplete: () => void;
};

type LinePhase = 'hidden' | 'enter' | 'hold' | 'dissolve';

type FirstContactScene =
  | { kind: 'black' }
  | { kind: 'line'; text: string; phase: LinePhase }
  | { kind: 'orbit'; orbitPhase: 'enter' | 'visible'; line: string; linePhase: LinePhase }
  | {
      kind: 'closing';
      orbitVisible: boolean;
      osaPhase: 'hidden' | 'enter' | 'visible';
      taglinePhase: 'hidden' | 'enter' | 'visible';
    }
  | { kind: 'final-dissolve'; orbitVisible: true; osaPhase: 'visible'; taglinePhase: 'visible' };

function waitMs(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function playLineBeat(
  text: string,
  setScene: (scene: FirstContactScene) => void,
  signal: AbortSignal,
): Promise<void> {
  setScene({ kind: 'line', text, phase: 'enter' });
  await waitMs(OSA_FIRST_CONTACT_LINE_ENTER_MS, signal);

  setScene({ kind: 'line', text, phase: 'hold' });
  await waitMs(OSA_FIRST_CONTACT_LINE_HOLD_MS, signal);

  setScene({ kind: 'line', text, phase: 'dissolve' });
  await waitMs(OSA_FIRST_CONTACT_LINE_DISSOLVE_MS, signal);
}

async function playOrbitLineBeat(
  text: string,
  setScene: (scene: FirstContactScene) => void,
  signal: AbortSignal,
): Promise<void> {
  setScene({
    kind: 'orbit',
    orbitPhase: 'visible',
    line: text,
    linePhase: 'enter',
  });
  await waitMs(OSA_FIRST_CONTACT_ORBIT_LINE_ENTER_MS, signal);

  setScene({
    kind: 'orbit',
    orbitPhase: 'visible',
    line: text,
    linePhase: 'hold',
  });
  await waitMs(OSA_FIRST_CONTACT_ORBIT_LINE_HOLD_MS, signal);

  setScene({
    kind: 'orbit',
    orbitPhase: 'visible',
    line: text,
    linePhase: 'dissolve',
  });
  await waitMs(OSA_FIRST_CONTACT_ORBIT_LINE_DISSOLVE_MS, signal);
}

export function OsaFirstContact({ onComplete }: OsaFirstContactProps) {
  const [scene, setScene] = useState<FirstContactScene>({ kind: 'black' });
  const completedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finish = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    stopOsaFirstContactAudio();
    markOsaFirstContactSeen();
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    const run = async () => {
      try {
        setScene({ kind: 'black' });
        await waitMs(OSA_FIRST_CONTACT_OPENING_SILENCE_MS, signal);

        void playOsaSonicLogo(1);
        await waitMs(OSA_FIRST_CONTACT_POST_SONIC_MS, signal);

        await playLineBeat(OSA_FIRST_CONTACT_OPENING_LINES[0] ?? '', setScene, signal);
        await waitMs(OSA_FIRST_CONTACT_LINE_GAP_MS, signal);
        await playLineBeat(OSA_FIRST_CONTACT_OPENING_LINES[1] ?? '', setScene, signal);

        setScene({ kind: 'orbit', orbitPhase: 'enter', line: '', linePhase: 'hidden' });
        await waitMs(OSA_FIRST_CONTACT_ORBIT_BIRTH_MS, signal);

        setScene({ kind: 'orbit', orbitPhase: 'visible', line: '', linePhase: 'hidden' });

        for (const line of OSA_FIRST_CONTACT_ORBIT_LINES) {
          await playOrbitLineBeat(line, setScene, signal);
        }

        setScene({
          kind: 'closing',
          orbitVisible: true,
          osaPhase: 'hidden',
          taglinePhase: 'hidden',
        });
        await waitMs(OSA_FIRST_CONTACT_CLOSING_SILENCE_MS, signal);

        setScene({
          kind: 'closing',
          orbitVisible: true,
          osaPhase: 'enter',
          taglinePhase: 'hidden',
        });
        await waitMs(OSA_FIRST_CONTACT_OSA_WORD_ENTER_MS, signal);

        setScene({
          kind: 'closing',
          orbitVisible: true,
          osaPhase: 'visible',
          taglinePhase: 'enter',
        });
        await waitMs(OSA_FIRST_CONTACT_TAGLINE_ENTER_MS, signal);

        setScene({
          kind: 'closing',
          orbitVisible: true,
          osaPhase: 'visible',
          taglinePhase: 'visible',
        });
        await waitMs(OSA_FIRST_CONTACT_CLOSING_HOLD_MS, signal);

        setScene({
          kind: 'final-dissolve',
          orbitVisible: true,
          osaPhase: 'visible',
          taglinePhase: 'visible',
        });
        await waitMs(OSA_FIRST_CONTACT_FINAL_DISSOLVE_MS, signal);

        finish();
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        throw error;
      }
    };

    void run();

    return () => {
      controller.abort();
      stopOsaFirstContactAudio();
    };
  }, [finish]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Enter') {
        return;
      }

      event.preventDefault();
      finish();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [finish]);

  const dissolving = scene.kind === 'final-dissolve';
  const showClosing = scene.kind === 'closing' || scene.kind === 'final-dissolve';
  const showOrbit =
    scene.kind === 'orbit' ||
    (showClosing && (scene.kind === 'closing' ? scene.orbitVisible : scene.orbitVisible));

  return (
    <div
      className={`osa-fc-screen ${dissolving ? 'osa-fc-screen-dissolve' : ''}`}
      role="presentation"
      onClick={finish}
    >
      {scene.kind === 'line' ? (
        <p
          className={`osa-fc-line ${
            scene.phase === 'enter'
              ? 'osa-fc-line-enter'
              : scene.phase === 'dissolve'
                ? 'osa-fc-line-dissolve'
                : 'osa-fc-line-visible'
          }`}
          aria-live="polite"
        >
          {scene.text}
        </p>
      ) : null}

      {scene.kind === 'orbit' && !showClosing ? (
        <div className="osa-fc-orbit-stage">
          <div
            className={
              scene.orbitPhase === 'enter' ? 'osa-fc-orbit osa-fc-orbit-emerge' : 'osa-fc-orbit osa-fc-orbit-visible'
            }
          >
            <OrbitMark size="lg" breathe={false} className="osa-fc-orbit-mark" />
          </div>

          {scene.line && scene.linePhase !== 'hidden' ? (
            <p
              className={`osa-fc-line osa-fc-line-with-orbit ${
                scene.linePhase === 'enter'
                  ? 'osa-fc-line-enter'
                  : scene.linePhase === 'dissolve'
                    ? 'osa-fc-line-dissolve'
                    : 'osa-fc-line-visible'
              }`}
              aria-live="polite"
            >
              {scene.line}
            </p>
          ) : null}
        </div>
      ) : null}

      {showClosing ? (
        <div className="osa-fc-closing">
          {showOrbit ? (
            <div className="osa-fc-orbit osa-fc-orbit-visible">
              <OrbitMark size="lg" breathe={false} className="osa-fc-orbit-mark" />
            </div>
          ) : null}

          <p
            className={`osa-fc-osa-word ${
              scene.kind === 'closing' && scene.osaPhase === 'enter'
                ? 'osa-fc-osa-word-enter'
                : scene.kind === 'closing' && scene.osaPhase === 'hidden'
                  ? 'osa-fc-osa-word-hidden'
                  : 'osa-fc-osa-word-visible'
            }`}
          >
            OSA
          </p>

          {(scene.kind === 'closing' && scene.taglinePhase !== 'hidden') ||
          scene.kind === 'final-dissolve' ? (
            <p
              className={`osa-fc-tagline ${
                scene.kind === 'closing' && scene.taglinePhase === 'enter'
                  ? 'osa-fc-tagline-enter'
                  : 'osa-fc-tagline-visible'
              }`}
              aria-live="polite"
            >
              {OSA_FIRST_CONTACT_CLOSING_TAGLINE}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
