"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { useInView, useReducedMotion, useTrackProgress } from "../hooks";
import { MandoPair } from "../phone/MandoPair";
import { MandoRemote } from "../phone/MandoRemote";
import { PhoneFrame } from "../phone/PhoneFrame";
import { RoleCards } from "../phone/RoleCards";
import { PairCode } from "../tv/PairCode";
import { Serie } from "../tv/Serie";
import { TvFrame } from "../tv/TvFrame";
import { CODE, FLY_FROM, FLY_SPAN, Flyers, PhoneB, TvB, type PhaseB } from "./ScenesB";

/** Track progress (0–1) → phase. Scenes are 220/200svh tall (span 320svh): the caption handoff
 *  (s4 leaving, s5 arriving at mid-screen) lands near p≈.53, just before the pairing at .55. */
export function phaseOf(p: number): PhaseB {
  if (p < 0.15) return "trackpad";
  if (p < 0.3) return "controls";
  if (p < 0.45) return "type";
  if (p < 0.55) return "talk";
  if (p < 0.85) return "pair";
  return "roles";
}

/** Digits of the code already on the phone: one every .075 from .55, all four at .85. */
export function digitsAt(p: number): number {
  // round first: 0.7 - 0.55 is 0.1499… in floating point
  const n = Math.floor(Math.round((p - FLY_FROM) * 1000) / (FLY_SPAN * 1000));
  return Math.min(CODE.length, Math.max(0, n));
}

/** In «controls» the series pauses, then resumes. */
function pausedAt(p: number): boolean {
  return p >= 0.19 && p < 0.26;
}

type Step = { phase: PhaseB; digits: number; paused: boolean };

/** Leaf that owns the per-frame progress (and --p); only the discrete step reaches the track. */
function Progress({ track, onStep }: { track: RefObject<HTMLElement | null>; onStep: (s: Step) => void }) {
  const p = useTrackProgress(track);
  const phase = phaseOf(p);
  const digits = digitsAt(p);
  const paused = pausedAt(p);
  useEffect(() => onStep({ phase, digits, paused }), [phase, digits, paused, onStep]);
  return null;
}

/** Tramo B · scenes 4–5: a phone with the remote beside the TV, then the pairing code and the roles. */
export function TrackB() {
  const t = useTranslations("screen");
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const trackView = useInView(track);
  // server / no-JS frame: the remote whole, its last zone lit (the end of scene 4)
  const [step, setStep] = useState<Step>({ phase: "talk", digits: 0, paused: false });
  const { phase, digits, paused } = step;

  useEffect(() => {
    track.current?.closest(".jscreen")?.setAttribute("data-hydrated", "");
  }, []);

  const s4 = (on2: boolean) => (
    <>
      <p data-on="true">{t("s4.caption1")}</p>
      <p data-step="" data-on={on2 ? "true" : "false"}>
        {t("s4.caption2")}
      </p>
    </>
  );
  const s5 = (on2: boolean) => (
    <>
      <p data-on="true">{t("s5.caption1")}</p>
      <p data-step="" data-on={on2 ? "true" : "false"}>
        {t("s5.caption2")}
      </p>
      <div data-step="" data-on={on2 ? "true" : "false"} className="tb-roles">
        <RoleCards />
      </div>
    </>
  );

  if (reduced) {
    // reduced motion: no sticky; scene 4 still, scene 5 at its final frame (code shown, paired, roles)
    return (
      <div ref={track} className="tbk tb-still" data-sticky="false">
        <section id="s4" data-scene="4" className="tb-row">
          <div className="tb-cap">{s4(true)}</div>
          <div className="tb-stage">
            <div className="tb-tv">
              <TvFrame>
                <Serie playing={false} progress={0.32} />
              </TvFrame>
            </div>
            <div className="tb-phone">
              <PhoneFrame>
                <MandoRemote focus="talk" cursor={{ x: 0.68, y: 0.34 }} playing={false} />
              </PhoneFrame>
            </div>
          </div>
        </section>
        <section id="s5" data-scene="5" className="tb-row">
          <div className="tb-cap">{s5(true)}</div>
          <div className="tb-stage">
            <div className="tb-tv">
              <TvFrame>
                <PairCode code={CODE} visibleDigits={CODE.length} />
              </TvFrame>
            </div>
            <div className="tb-phone">
              <PhoneFrame>
                <MandoPair digits={CODE.length} code={CODE} paired />
              </PhoneFrame>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const playing = trackView.inView && !paused;
  return (
    <div ref={track} className="tbk tb-live" data-sticky="true" data-phase={phase}>
      <Progress track={track} onStep={setStep} />
      <div className="tb-grid">
        <div className="tb-sticky">
          <div className="tb-stage">
            <div className="tb-tv">
              <TvFrame paused={!trackView.inView}>
                <TvB phase={phase} digits={digits} playing={playing} />
              </TvFrame>
            </div>
            <div className="tb-phone">
              <PhoneB phase={phase} digits={digits} playing={playing} />
            </div>
            <Flyers live={phase === "pair"} />
          </div>
        </div>
        <section id="s4" data-scene="4" className="tb-scene">
          <div className="tb-cap">{s4(phase !== "trackpad")}</div>
        </section>
        <section id="s5" data-scene="5" className="tb-scene">
          <div className="tb-cap">{s5(phase === "roles")}</div>
        </section>
      </div>
    </div>
  );
}
