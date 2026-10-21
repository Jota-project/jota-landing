"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(REDUCED_QUERY);
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function useInView(
  ref: RefObject<Element | null>,
  opts: { threshold?: number; rootMargin?: string } = {},
): { inView: boolean; passed: boolean } {
  const { threshold = 0, rootMargin = "0px" } = opts;
  const [state, setState] = useState({ inView: false, passed: false });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e) return;
        const inView = e.isIntersecting;
        const passed = !inView && e.boundingClientRect.bottom < 0;
        setState((s) => (s.inView === inView && s.passed === passed ? s : { inView, passed }));
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, rootMargin]);
  return state;
}

/** Track progress 0-1: top of the track at viewport top = 0, bottom at viewport bottom = 1. */
export function useTrackProgress(ref: RefObject<HTMLElement | null>): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let raf = 0;
    let last = -1;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const v = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : r.top <= 0 ? 1 : 0;
      if (v !== last) {
        last = v;
        el.style.setProperty("--p", String(v));
        setP(v);
      }
    };
    const loop = () => {
      measure();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      if (!e) return;
      if (e.isIntersecting) {
        if (!raf) loop();
      } else {
        stop();
        measure(); // settle at 0 or 1 once out of view
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [ref]);
  return p;
}

export type ScriptEvent = { at: number; id: string };

export function useScript(
  events: ScriptEvent[],
  opts: { play: boolean; skip: boolean; speed?: number },
): { done: Set<string>; finished: boolean; replay(): void } {
  const reduced = useReducedMotion();
  const skip = opts.skip || reduced;
  const { play } = opts;
  const speed = opts.speed && opts.speed > 0 ? opts.speed : 1;
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const [finished, setFinished] = useState(false);
  const eventsRef = useRef(events);
  const speedRef = useRef(speed);
  const skipRef = useRef(skip);
  useEffect(() => {
    skipRef.current = skip;
    eventsRef.current = events;
    speedRef.current = speed;
  });
  const started = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const run = useCallback(() => {
    clear();
    started.current = true;
    const evs = eventsRef.current;
    const fire = (id: string, last: boolean) => {
      setDone((prev) => new Set(prev).add(id));
      if (last) setFinished(true);
    };
    if (evs.length === 0) {
      setFinished(true);
      return;
    }
    evs.forEach((ev, i) => {
      const last = i === evs.length - 1;
      const delay = ev.at / speedRef.current;
      if (delay <= 0) fire(ev.id, last);
      else timers.current.push(setTimeout(() => fire(ev.id, last), delay));
    });
  }, [clear]);

  useEffect(() => {
    if (skip) {
      clear();
      started.current = true;
      setDone(new Set(eventsRef.current.map((e) => e.id)));
      setFinished(true);
      return;
    }
    if (play && !started.current) run();
  }, [skip, play, run, clear]);

  useEffect(
    () => () => {
      clear();
      started.current = false;
    },
    [clear],
  );

  const replay = useCallback(() => {
    clear();
    if (skipRef.current) {
      setDone(new Set(eventsRef.current.map((e) => e.id)));
      setFinished(true);
      return;
    }
    setDone(new Set());
    setFinished(false);
    run();
  }, [clear, run]);

  return { done, finished, replay };
}
