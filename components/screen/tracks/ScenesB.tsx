"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { MandoPair } from "../phone/MandoPair";
import { MandoRemote } from "../phone/MandoRemote";
import { PhoneFrame } from "../phone/PhoneFrame";
import { Orb } from "../tv/Orb";
import { PairCode } from "../tv/PairCode";
import { Serie } from "../tv/Serie";

export type PhaseB = "trackpad" | "controls" | "type" | "talk" | "pair" | "roles";
export const CODE = "4821";
/** Each digit flies for .075 of the track, the first from .55 (see digitsAt). */
export const FLY_FROM = 0.55;
export const FLY_SPAN = 0.075;
// resting finger on the trackpad (and cursor on the TV) when nothing drives it
export const REST = { x: 0.68, y: 0.34 };

const on = (b: boolean) => (b ? "true" : "false");
const pairing = (ph: PhaseB) => ph === "pair" || ph === "roles";

/** The TV of tramo B: the series with each echo of the remote on top, then the pairing code, shown in full
 *  from the start (Ruling 7); its digits fly one by one to the phone. */
export const TvB = memo(function TvB({ phase, playing }: { phase: PhaseB; playing: boolean }) {
  const t = useTranslations("screen");
  return (
    <>
      <Serie playing={playing && !pairing(phase)} progress={0.32} />
      <div className="tb-cur" data-on={on(phase === "trackpad")} style={{ "--cx0": REST.x, "--cy0": REST.y } as CSSProperties}>
        <i />
      </div>
      <div className="tb-osd" data-on={on(phase === "controls" && !playing)}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="5" width="4.2" height="14" rx="1.4" />
          <rect x="13.8" y="5" width="4.2" height="14" rx="1.4" />
        </svg>
      </div>
      <div className="tb-search" data-on={on(phase === "type")}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <span className="tx">
          {t("tv.showTitle")}
          <i />
        </span>
      </div>
      <div className="tb-listen" data-on={on(phase === "talk")}>
        <Orb state="listen" size={72} />
        <span>{t("remote.talk")}</span>
      </div>
      <div className="tb-pair" data-on={on(pairing(phase))}>
        <PairCode code={CODE} visibleDigits={CODE.length} />
      </div>
    </>
  );
});

/** The phone: the remote while it shows its controls, then its pairing view. */
export const PhoneB = memo(function PhoneB({ phase, digits, playing }: { phase: PhaseB; digits: number; playing: boolean }) {
  const remote = !pairing(phase);
  return (
    <PhoneFrame>
      <div className="tb-layer" data-on={on(remote)}>
        <MandoRemote focus={remote ? (phase as "trackpad" | "controls" | "type" | "talk") : "talk"} cursor={REST} playing={playing} />
      </div>
      <div className="tb-layer" data-on={on(!remote)}>
        <MandoPair digits={digits} code={CODE} paired={phase === "roles"} />
      </div>
    </PhoneFrame>
  );
});

type Flight = { x: number; y: number; w: number; h: number; dx: number; dy: number; k: number };

/** The digits travelling from the TV to the phone. They live beside the TV (it clips its canvas) and are driven
 *  by --p: digit i flies from FLY_FROM + i·FLY_SPAN and fades as its slot on the phone fills. Positions are
 *  measured once the pairing starts and whenever the stage changes size; cleared when the pairing ends. */
export function Flyers({ live }: { live: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  useEffect(() => {
    if (!live) return;
    const stage = ref.current?.parentElement;
    if (!stage) return;
    const measure = () => {
      const o = stage.getBoundingClientRect();
      const from = [...stage.querySelectorAll('.tb-pair [data-testid="tv-digit"]')];
      const to = [...stage.querySelectorAll(".mp [data-slot]")];
      if (from.length !== CODE.length || to.length !== CODE.length) return;
      setFlights(
        to.map((slot, i) => {
          const a = from[i].getBoundingClientRect();
          const b = slot.getBoundingClientRect();
          return {
            x: b.left - o.left,
            y: b.top - o.top,
            w: b.width,
            h: b.height,
            dx: a.left + a.width / 2 - (b.left + b.width / 2),
            dy: a.top + a.height / 2 - (b.top + b.height / 2),
            k: b.height > 0 ? a.height / b.height : 1,
          };
        }),
      );
    };
    // next frame: TvFrame and PhoneFrame rescale (--s, --ps) from their own ResizeObservers first
    let raf = requestAnimationFrame(measure);
    const later = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(later);
    ro?.observe(stage);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      setFlights([]); // stale paths never come back on the next pairing
    };
  }, [live]);
  return (
    <div ref={ref} className="tb-fly" data-on={on(live)} aria-hidden="true">
      {live &&
        flights.map((f, i) => (
          <span
            key={i}
            style={
              {
                left: f.x,
                top: f.y,
                width: f.w,
                height: f.h,
                fontSize: f.h * 0.62,
                "--dx": `${f.dx}px`,
                "--dy": `${f.dy}px`,
                "--k": f.k,
                "--t0": FLY_FROM + i * FLY_SPAN,
              } as CSSProperties
            }
          >
            {CODE[i]}
          </span>
        ))}
    </div>
  );
}
