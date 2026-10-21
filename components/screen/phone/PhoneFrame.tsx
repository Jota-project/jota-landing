"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

const W = 390;

/** Phone box (390×844, 48px corners, no fake status bar). CSS scales its canvas with container units where it
 *  can; --ps = width / 390 (set before paint) is the fallback and also sizes the frame. */
export function PhoneFrame({ className = "", children }: { className?: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = (w: number) => {
      if (w > 0) el.style.setProperty("--ps", String(w / W));
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
    <div ref={ref} data-testid="phone-frame" className={`ph-vp ${className}`.trim()}>
      <div className="ph-screen" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
