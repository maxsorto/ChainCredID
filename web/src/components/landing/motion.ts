"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** True when the user asked for reduced motion. Scenes then render their final frame. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Fires once when the element enters the viewport. */
export function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/**
 * A tiny step sequencer. `durations[i]` is how long step i is held before advancing.
 * Starts when the stage scrolls into view, holds on the last step, and can be replayed.
 * Under reduced motion it jumps straight to the last step.
 */
export function useScene(durations: number[]) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [run, setRun] = useState(0);
  const last = durations.length - 1;

  useEffect(() => {
    if (!inView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reduced) {
      timers.push(setTimeout(() => setStep(last), 0));
      return () => timers.forEach(clearTimeout);
    }
    // Schedule every step up front; the cleanup cancels the whole run on replay/unmount.
    timers.push(setTimeout(() => setStep(0), 0));
    let at = 0;
    for (let i = 1; i <= last; i++) {
      at += durations[i - 1];
      const target = i;
      timers.push(setTimeout(() => setStep(target), at));
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced, run, last]);

  const replay = useCallback(() => setRun((r) => r + 1), []);
  return { ref, step, replay, done: step >= last, started: inView };
}

/**
 * Reveals `text` character by character from mount. Mount the consuming component only when the
 * line should appear (the Terminal does this), so no reset logic is needed here.
 */
export function useTyped(text: string, cps = 55) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setN((k) => {
        if (reduced || k >= text.length) {
          clearInterval(id);
          return text.length;
        }
        return k + 1;
      });
    }, 1000 / cps);
    return () => clearInterval(id);
  }, [text, reduced, cps]);
  return { shown: text.slice(0, n), typing: n < text.length };
}
