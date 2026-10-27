"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/components/screen/hooks";
import { JOTA_GAP, Words, YOU_GAP } from "@/components/screen/tv/Words";

/** Steps of the example: 0 idle, 1 listening (you speak), 2 thinking (tool runs), 3 tool done + light off,
 *  4 speaking (answer), 5 done. FINAL is the frame shown before JS, under reduced motion and at the end. */
export const FINAL = 5;
// ms from the previous step; 1500 after your words is the silence jota-voice waits before closing the sentence
export function schedule(saidWords: number, answerWords: number): number[] {
  return [500, saidWords * YOU_GAP + 1500, 1600, 700, answerWords * JOTA_GAP + 400];
}

/** Words drawn one by one for the eye; screen readers get the sentence whole (the word spans carry no spaces). */
function Said({ text, run, play, gap }: { text: string; run: number; play: boolean; gap: number }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        <Words key={run} text={text} play={play} gap={gap} />
      </span>
    </>
  );
}

export function ConversationPanel() {
  const t = useTranslations("home.talk");
  const reduced = useReducedMotion();
  const [step, setStep] = useState(FINAL);
  const [run, setRun] = useState(0);
  const [fade, setFade] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function play() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setFade(true);
    // a short fade out of the resting frame, then the example plays from the start
    timers.current.push(
      setTimeout(() => {
        setFade(false);
        setRun((r) => r + 1);
        setStep(0);
        let at = 0;
        schedule(t("said").split(" ").length, t("answer").split(" ").length).forEach((ms, i) => {
          at += ms;
          timers.current.push(setTimeout(() => setStep(i + 1), at));
        });
      }, 250),
    );
  }

  useEffect(() => {
    if (reduced) return;
    const first = setTimeout(play, 900);
    return () => {
      clearTimeout(first);
      timers.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- plays once per mount
  }, [reduced]);

  const shown = reduced ? FINAL : step;
  const live = !reduced && run > 0;
  const orb = shown === 1 ? "listen" : shown === 2 || shown === 3 ? "think" : shown === 4 ? "talk" : "idle";
  const label = [t("idle"), t("listen"), t("think"), t("think"), t("talkState"), t("done")][shown];

  return (
    <div className="hm-panel" data-lamp={shown >= 3 ? "off" : "on"} data-step={shown}>
      <div className="hm-body" data-fade={fade}>
        <div className="hm-top">
          <div className="hm-orb" data-state={orb} aria-hidden="true">
            <span className="hm-sat" />
          </div>
          <span className="hm-state" aria-live="polite">{label}</span>
          <span className="hm-lamp">
            <i aria-hidden="true" />
            {t("lamp")}
          </span>
        </div>
        <p className="hm-said">
          {shown >= 1 && <Said text={`«${t("said")}»`} run={run} play={live} gap={YOU_GAP} />}
        </p>
        <div className="hm-tool" data-state={shown < 2 ? "none" : shown === 2 ? "run" : "done"}>
          <span className="hm-tick" aria-hidden="true">
            <span className="spin" />
            <span className="ok">
              <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
          </span>
          <span>
            <b>{t("tool")}</b>
            <small>{t("toolSub")}</small>
          </span>
        </div>
        <p className="hm-answer">
          {shown >= 4 && <Said text={t("answer")} run={run} play={live} gap={JOTA_GAP} />}
        </p>
      </div>
      <div className="hm-foot">
        <p>{t("note")}</p>
        {!reduced && (
          <button type="button" className="hm-again" onClick={play}>
            {t("again")}
          </button>
        )}
      </div>
    </div>
  );
}
