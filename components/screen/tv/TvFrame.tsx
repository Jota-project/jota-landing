"use client";

import { createContext, useLayoutEffect, useRef, type ReactNode } from "react";

const W = 1920;

/** True while the TV is off screen: what animates inside it with JS (the glass) stops. */
export const PausedContext = createContext(false);

/** 16:9 box that scales a fixed 1920×1080 canvas. CSS scales it with container units where it can;
 *  --s = width / 1920 (set before paint) is the fallback. The canvas is aria-hidden: what it says is
 *  told in text beside it. */
export function TvFrame({
  paused = false,
  className = "",
  children,
}: {
  paused?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = (w: number) => {
      if (w > 0) el.style.setProperty("--s", String(w / W));
    };
    fit(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[entries.length - 1];
      fit(e?.contentRect?.width || el.clientWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      // FitFrames may have set --s on it before hydration
      suppressHydrationWarning
      data-testid="tv-frame"
      data-paused={paused ? "true" : "false"}
      className={`tv-vp ${className}`.trim()}
    >
      <div className="tv-stage" aria-hidden="true">
        <PausedContext.Provider value={paused}>{children}</PausedContext.Provider>
      </div>
    </div>
  );
}
