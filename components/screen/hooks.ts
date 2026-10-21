"use client";

import { useEffect, useState, type RefObject } from "react";

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
        // above the root. With a root margin its top is not the viewport's (e.g. -50% → mid-screen), and an
        // element leaving upwards stops intersecting with its bottom right on that line
        const b = e.boundingClientRect.bottom;
        const passed = !inView && (e.rootBounds ? b <= e.rootBounds.top : b < 0);
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
