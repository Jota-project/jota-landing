"use client";

import { useEffect, useRef, type ReactNode } from "react";

const W = 1920;

/** 16:9 box that scales a fixed 1920×1080 canvas with --s = width / 1920. */
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
  useEffect(() => {
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
      data-testid="tv-frame"
      data-paused={paused ? "true" : "false"}
      className={`tv-vp ${className}`.trim()}
    >
      <div className="tv-stage" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
