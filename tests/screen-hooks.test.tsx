import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useInView, useReducedMotion, useTrackProgress } from "@/components/screen/hooks";
import { FAST, STEP_MAX, eventsDone, firstEvents, readsAlong, stillReading } from "@/components/screen/tracks/scriptsA";

type IOCb = (entries: Partial<IntersectionObserverEntry>[]) => void;
let ioCbs: IOCb[] = [];
let mqMatches = false;
let mqListeners: (() => void)[] = [];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"] });
  ioCbs = [];
  mqMatches = false;
  mqListeners = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IOCb) {
        ioCbs.push(cb);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  window.matchMedia = ((q: string) => ({
    get matches() {
      return mqMatches;
    },
    media: q,
    addEventListener: (_: string, l: () => void) => mqListeners.push(l),
    removeEventListener: (_: string, l: () => void) => {
      mqListeners = mqListeners.filter((x) => x !== l);
    },
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useInView", () => {
  it("reports passed when mounted below the element", () => {
    const el = document.createElement("div");
    const ref = { current: el };
    const { result } = renderHook(() => useInView(ref));
    act(() =>
      ioCbs[0]([{ isIntersecting: false, boundingClientRect: { bottom: -10 } as DOMRectReadOnly }]),
    );
    expect(result.current).toEqual({ inView: false, passed: true });
    act(() =>
      ioCbs[0]([{ isIntersecting: true, boundingClientRect: { bottom: 100 } as DOMRectReadOnly }]),
    );
    expect(result.current).toEqual({ inView: true, passed: false });
  });
});

describe("useInView passed with a root margin", () => {
  it("counts an element that left above a shrunken root as passed (bottom at the root's top)", () => {
    const el = document.createElement("div");
    const ref = { current: el };
    const { result } = renderHook(() => useInView(ref, { rootMargin: "-50% 0px -50% 0px" }));
    act(() =>
      ioCbs[0]([
        { isIntersecting: false, boundingClientRect: { bottom: 450 } as DOMRectReadOnly, rootBounds: { top: 450 } as DOMRectReadOnly },
      ]),
    );
    expect(result.current).toEqual({ inView: false, passed: true });
    // still below the middle line: not passed
    act(() =>
      ioCbs[0]([
        { isIntersecting: false, boundingClientRect: { bottom: 1400 } as DOMRectReadOnly, rootBounds: { top: 450 } as DOMRectReadOnly },
      ]),
    );
    expect(result.current).toEqual({ inView: false, passed: false });
  });
});

describe("useReducedMotion", () => {
  it("follows the media query", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    mqMatches = true;
    act(() => mqListeners.forEach((l) => l()));
    expect(result.current).toBe(true);
  });
});

describe("useTrackProgress", () => {
  it("runs rAF only while in view, clamps 0-1 and writes --p", () => {
    vi.stubGlobal("innerHeight", 800);
    const el = document.createElement("div");
    const ref = { current: el };
    let top = -600;
    el.getBoundingClientRect = () => ({ top, height: 2000 }) as DOMRect;
    const { result } = renderHook(() => useTrackProgress(ref));
    expect(vi.getTimerCount()).toBe(0);
    act(() => ioCbs[0]([{ isIntersecting: true }]));
    expect(result.current).toBeCloseTo(0.5);
    expect(el.style.getPropertyValue("--p")).toBe("0.5");
    top = -5000;
    act(() => void vi.advanceTimersByTime(50));
    expect(result.current).toBe(1);
    top = 300;
    act(() => ioCbs[0]([{ isIntersecting: false }]));
    expect(result.current).toBe(0);
    const t = vi.getTimerCount();
    act(() => void vi.advanceTimersByTime(100));
    expect(vi.getTimerCount()).toBe(t);
  });
});

describe("eventsDone", () => {
  const evs = [
    { pos: 0.2, id: "a" },
    { pos: 0.5, id: "b" },
    { pos: 1.1, id: "c" },
  ];
  it("is every event whose position has been passed (the position itself counts)", () => {
    expect([...eventsDone(evs, -1)]).toEqual([]);
    expect([...eventsDone(evs, 0.19)]).toEqual([]);
    expect([...eventsDone(evs, 0.2)]).toEqual(["a"]);
    expect([...eventsDone(evs, 0.7)]).toEqual(["a", "b"]);
    expect([...eventsDone(evs, 1.1)]).toEqual(["a", "b", "c"]);
    expect([...eventsDone(evs, 99)]).toEqual(["a", "b", "c"]);
  });
  it("goes both ways: scrolling back takes events off", () => {
    const down = [0, 0.3, 0.6, 1.2].map((q) => eventsDone(evs, q).size);
    const up = [1.2, 0.6, 0.3, 0].map((q) => eventsDone(evs, q).size);
    expect(down).toEqual([0, 1, 2, 3]);
    expect(up).toEqual([3, 2, 1, 0]);
  });
  it("firstEvents(n) is the same set as eventsDone at the n-th position", () => {
    for (let n = 0; n <= evs.length; n++) {
      const q = n === 0 ? 0 : evs[n - 1].pos;
      expect([...firstEvents(evs, n)]).toEqual([...eventsDone(evs, q)]);
    }
  });
  it("reads along (animates) only on a forward step at reading speed, close to the event", () => {
    expect(readsAlong(evs, 0, 1, 0.25, 0.4)).toBe(true);
    expect(readsAlong(evs, 1, 2, 0.5, 0.4)).toBe(true);
    // two close events crossed in one frame still read along
    const close = [
      { pos: 0.5, id: "tool" },
      { pos: 0.56, id: "music" },
    ];
    expect(readsAlong(close, 0, 2, 0.58, 0.4)).toBe(true);
    // landing far past the event (restored scroll, an anchor)
    expect(readsAlong(evs, 0, 1, 0.2 + STEP_MAX + 0.01, 0.4)).toBe(false);
    expect(readsAlong(evs, 0, 3, 1.2, 0.4)).toBe(false);
    // skimming
    expect(readsAlong(evs, 0, 1, 0.25, FAST + 0.1)).toBe(false);
    // scrolling back, or no change
    expect(readsAlong(evs, 2, 1, 0.4, 0.4)).toBe(false);
    expect(readsAlong(evs, 1, 1, 0.4, 0.4)).toBe(false);
  });
  it("a line read along completes (stops animating) once the scroll is STEP_MAX past its event", () => {
    expect(stillReading(evs, 1, 0.2)).toBe(true);
    expect(stillReading(evs, 1, 0.2 + STEP_MAX - 0.01)).toBe(true);
    expect(stillReading(evs, 1, 0.2 + STEP_MAX)).toBe(false);
    expect(stillReading(evs, 0, 0.1)).toBe(false);
  });
});
