"use client";

import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion, useTrackProgress } from "../hooks";

/** Rounded rectangle as a path (pathLength works the same on every browser). */
function box(x: number, y: number, w: number, h: number, r: number): string {
  return `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
}

/** --a: where in the track (0–1) this stroke starts drawing; --w: how long it takes. */
const at = (a: number, w = 0.12): CSSProperties => ({ "--a": a, "--w": w }) as CSSProperties;

/** Leaf that owns the per-frame progress; it only writes --p on the track (no React state goes up). */
function Progress({ track }: { track: RefObject<HTMLElement | null> }) {
  useTrackProgress(track);
  return null;
}

/** Tramo C · scene 6: what you need. The line drawing is finished by the end of the track. */
export function TrackC() {
  const t = useTranslations("screen");
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track.current?.closest(".jscreen")?.setAttribute("data-hydrated", "");
  }, []);

  return (
    <section
      id="s6"
      data-scene="6"
      ref={track}
      className="tck"
      data-sticky={reduced ? "false" : "true"}
      style={reduced ? ({ "--p": 1 } as CSSProperties) : undefined}
    >
      {!reduced && <Progress track={track} />}
      <div className="tck-in">
        <svg
          className="tck-svg"
          viewBox="0 0 640 440"
          role="img"
          aria-label={t("s6.alt")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <g className="tck-s">
            <path d={box(20, 50, 150, 90, 12)} pathLength={1} style={at(0.04, 0.14)} />
            <path d="M44 110H96M140 110h8" pathLength={1} style={at(0.16, 0.05)} />
            <path className="tck-hl" d="M170 95H410M410 85V105M410 85H430V105H410" pathLength={1} style={at(0.2, 0.2)} />
            <path d="M170 120H215V250" pathLength={1} style={at(0.46, 0.08)} />
            <path d={box(440, 35, 180, 100, 10)} pathLength={1} style={at(0.38, 0.14)} />
            <path d="M530 135V158M494 158H566" pathLength={1} style={at(0.5, 0.06)} />
            <path d={box(20, 250, 380, 120, 16)} pathLength={1} style={at(0.5, 0.14)} />
            <path className="tck-hl" d="M400 310H496M486 299L497 310L486 321" pathLength={1} style={at(0.68, 0.14)} />
            <path d={box(500, 225, 100, 170, 18)} pathLength={1} style={at(0.8, 0.12)} />
            <path d="M535 242H565" pathLength={1} style={at(0.9, 0.05)} />
          </g>
          <g className="tck-t" stroke="none" fill="currentColor">
            <text x="20" y="172" style={at(0.1, 0.04)}>
              {t("s6.pc")}
            </text>
            <text x="290" y="80" textAnchor="middle" className="tck-acc" style={at(0.3, 0.04)}>
              {t("s6.hdmi")}
            </text>
            <text x="440" y="190" style={at(0.5, 0.04)}>
              {t("s6.tv")}
            </text>
            <text x="40" y="288" className="tck-b" style={at(0.62, 0.04)}>
              {t("s6.gateway")}
            </text>
            <text x="40" y="340" style={at(0.64, 0.04)}>
              {t("s6.listen")}
            </text>
            <text x="150" y="340" style={at(0.67, 0.04)}>
              {t("s6.think")}
            </text>
            <text x="260" y="340" style={at(0.7, 0.04)}>
              {t("s6.answer")}
            </text>
            <text x="500" y="425" style={at(0.9, 0.04)}>
              {t("s6.phone")}
            </text>
          </g>
        </svg>
        <div className="tck-copy">
          <p>{t("s6.line1")}</p>
          <p>{t("s6.line2")}</p>
          <p className="tck-chipline">
            <span className="tck-chip" data-testid="soon">
              {t("s6.soon")}
            </span>
          </p>
          <p className="tck-net">{t("s6.network")}</p>
        </div>
      </div>
    </section>
  );
}
