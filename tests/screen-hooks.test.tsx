import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useInView, useReducedMotion, useScript, useTrackProgress } from "@/components/screen/hooks";

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

const evs = [
  { at: 0, id: "a" },
  { at: 500, id: "b" },
];

describe("useScript", () => {
  it("fires events in order", () => {
    const { result } = renderHook(() => useScript(evs, { play: true, skip: false }));
    expect([...result.current.done]).toEqual(["a"]);
    expect(result.current.finished).toBe(false);
    act(() => void vi.advanceTimersByTime(500));
    expect([...result.current.done]).toEqual(["a", "b"]);
    expect(result.current.finished).toBe(true);
  });

  it("does not replay when play toggles again", () => {
    const { result, rerender } = renderHook(({ play }) => useScript(evs, { play, skip: false }), {
      initialProps: { play: true },
    });
    act(() => void vi.advanceTimersByTime(500));
    rerender({ play: false });
    rerender({ play: true });
    expect(result.current.done.size).toBe(2);
    expect(result.current.finished).toBe(true);
  });

  it("skip jumps to final state", () => {
    const { result, rerender } = renderHook(({ skip }) => useScript(evs, { play: true, skip }), {
      initialProps: { skip: false },
    });
    rerender({ skip: true });
    expect([...result.current.done].sort()).toEqual(["a", "b"]);
    expect(result.current.finished).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("behaves like skip under reduced motion", () => {
    mqMatches = true;
    const { result } = renderHook(() => useScript(evs, { play: false, skip: false }));
    expect(result.current.done.size).toBe(2);
    expect(result.current.finished).toBe(true);
  });

  it("returns a new Set each time done changes", () => {
    const { result } = renderHook(() => useScript(evs, { play: true, skip: false }));
    const first = result.current.done;
    act(() => void vi.advanceTimersByTime(500));
    expect(result.current.done).not.toBe(first);
  });

  it("replay restarts", () => {
    const { result } = renderHook(() => useScript(evs, { play: true, skip: false }));
    act(() => void vi.advanceTimersByTime(500));
    act(() => result.current.replay());
    expect([...result.current.done]).toEqual(["a"]);
    expect(result.current.finished).toBe(false);
    act(() => void vi.advanceTimersByTime(500));
    expect(result.current.finished).toBe(true);
  });

  it("clears timers on unmount", () => {
    const { unmount } = renderHook(() => useScript(evs, { play: true, skip: false }));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
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
