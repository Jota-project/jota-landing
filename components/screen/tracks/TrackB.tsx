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
import { CODE, FLY_FROM, FLY_SPAN, Flyers, PhoneB, REST, TvB, type PhaseB } from "./ScenesB";

/** Track progress (0–1) → phase. Scenes are 240/240svh tall (span 380svh): each zone of the remote gets
 *  ~.12 (~.45 screen); the caption handoff (s5 reaching mid-screen) lands at p = .5, just after the pairing at .49;
 *  the digits fly from .51 to .83 and the roles come at .86. */
export function phaseOf(p: number): PhaseB {
  if (p < 0.14) return "trackpad";
  if (p < 0.26) return "controls";
  if (p < 0.38) return "type";
  if (p < 0.49) return "talk";
  if (p < 0.86) return "pair";
  return "roles";
}

/** Digits of the code already on the phone: one every .08 from .51, all four at .83. */
export function digitsAt(p: number): number {
  // round first: 0.7 - 0.55 is 0.1499… in floating point
  const n = Math.floor(Math.round((p - FLY_FROM) * 1000) / (FLY_SPAN * 1000));
  return Math.min(CODE.length, Math.max(0, n));
}

/** In «controls» the series pauses, then resumes. */
function pausedAt(p: number): boolean {
  return p >= 0.17 && p < 0.23;
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
                <MandoRemote focus="talk" cursor={REST} playing={false} />
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
    // off screen every animation below stops: the series on the TV and the phone's ambient orbs
    <div ref={track} className="tbk tb-live" data-sticky="true" data-phase={phase} data-paused={trackView.inView ? "false" : "true"}>
      <Progress track={track} onStep={setStep} />
      <div className="tb-grid">
        <div className="tb-sticky">
          <div className="tb-stage">
            <div className="tb-tv">
              <TvFrame paused={!trackView.inView}>
                <TvB phase={phase} playing={playing} />
              </TvFrame>
              {/* a fine line under the TV that follows the scroll through the track */}
              <i className="tb-meter" aria-hidden="true" />
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
