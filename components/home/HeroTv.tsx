"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useInView, useReducedMotion } from "@/components/screen/hooks";
import { TvFrame } from "@/components/screen/tv/TvFrame";
import { Serie } from "@/components/screen/tv/Serie";
import { ChatPill } from "@/components/screen/tv/ChatPill";
import { JOTA_GAP, YOU_GAP } from "@/components/screen/tv/Words";
import type { TurnState } from "@/components/screen/tv/GlassPanel";

type Step = 0 | 1 | 2 | 3 | 4 | 5;
const DONE: Step = 5;

/** Delays (ms) between the steps of the TV's one turn: pill opens → you → the tool runs → done → Jota → idle. */
export function schedule(youWords: number, jotaWords: number): number[] {
  return [700, youWords * YOU_GAP + 500, 1400, 500, jotaWords * JOTA_GAP + 900];
}

const STATES: TurnState[] = [
  { you: false, tool: "none", jota: false },
  { you: true, tool: "none", jota: false },
  { you: true, tool: "run", jota: false },
  { you: true, tool: "done", jota: false },
  { you: true, tool: "done", jota: true },
  { you: true, tool: "done", jota: true },
];
const ORB = ["idle", "listen", "think", "think", "talk", "idle"] as const;

/** The TV of the hero: the series plays and, once in view, Jota answers one question over it. Reduced motion shows
 *  the finished frame. The canvas is aria-hidden: the caption beside it says what happens. */
export function HeroTv() {
  const t = useTranslations("home.hero");
  const chat = useTranslations("screen.chat");
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { inView } = useInView(ref, { threshold: 0.4 });
  const [step, setStep] = useState<Step>(0);
  const [run, setRun] = useState(0);
  const started = useRef(false);

  const turn = { you: chat("series1You"), tool: { icon: "where" as const, title: chat("toolWhere") }, jota: chat("series1Jota") };

  // reduced motion shows the finished frame without ever running the schedule
  const view: Step = reduced ? DONE : step;

  useEffect(() => {
    if (reduced || !inView || started.current) return;
    started.current = true;
    const gaps = schedule(turn.you.split(" ").length, turn.jota.split(" ").length);
    let s: Step = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      s = (s + 1) as Step;
      setStep(s);
      if (s < DONE) timer = setTimeout(next, gaps[s]);
    };
    timer = setTimeout(next, gaps[0]);
    return () => clearTimeout(timer);
    // the turn's text only changes with the locale, which remounts the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced, run]);

  const replay = () => {
    started.current = false;
    setStep(0);
    setRun((n) => n + 1);
  };

  return (
    <div ref={ref} className="jscreen hm-tv" data-step={view}>
      <div role="img" aria-label={t("tvLabel")}>
        <TvFrame paused={!inView}>
          <Serie playing={inView} progress={0.37} />
          <ChatPill open={view > 0} turn={turn} state={STATES[view]} orb={ORB[view]} animate={!reduced && view < DONE} />
        </TvFrame>
      </div>
      <p className="hm-cap">
        {t("caption")}
        {!reduced && view === DONE && (
          <button type="button" className="hm-replay" onClick={replay}>
            {t("replay")}
          </button>
        )}
      </p>
    </div>
  );
}
