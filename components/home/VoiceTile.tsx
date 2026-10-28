"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useInView, useReducedMotion } from "@/components/screen/hooks";
import { Orb } from "@/components/screen/tv/Orb";
import { JOTA_GAP, Words, YOU_GAP } from "@/components/screen/tv/Words";

type Phase = "idle" | "listen" | "think" | "talk" | "done";

/** jota-voice as a speaker: the orb listens while you ask for a reminder, thinks, and answers. Reduced motion
 *  shows the finished exchange. The canvas is aria-hidden: the figure's label says what happens. */
export function VoiceTile() {
  const t = useTranslations("home.house");
  const chat = useTranslations("screen.chat");
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { inView } = useInView(ref, { threshold: 0.6 });
  const [run, setPhase] = useState<Phase>("idle");
  // reduced motion shows the finished exchange without ever running the steps
  const phase: Phase = reduced ? "done" : run;
  const started = useRef(false);
  const you = chat("series2You");
  const jota = chat("series2Jota");

  useEffect(() => {
    if (reduced || !inView || started.current) return;
    started.current = true;
    // the voice client waits 1.5 s of silence before it closes what you said
    const steps: [Phase, number][] = [
      ["listen", 600],
      ["think", you.split(" ").length * YOU_GAP + 1500],
      ["talk", 1200],
      ["done", jota.split(" ").length * JOTA_GAP + 800],
    ];
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      const s = steps[i++];
      if (!s) return;
      setPhase(s[0]);
      timer = setTimeout(next, s[1]);
    };
    timer = setTimeout(next, steps[0][1]);
    return () => clearTimeout(timer);
  }, [inView, reduced, you, jota]);

  const orb = phase === "done" ? "idle" : phase;
  const showYou = phase !== "idle";
  const showJota = phase === "talk" || phase === "done";
  const live = !reduced && phase !== "done";

  return (
    <div ref={ref} className="jscreen hm-voice" data-phase={phase}>
      <div role="img" aria-label={t("voiceLabel")} className="hm-voice-in">
        <div className="hm-voice-orb" aria-hidden="true">
          <Orb state={orb} size={72} />
          <span className="hm-voice-state">{t(orb)}</span>
        </div>
        <div className="hm-voice-log" aria-hidden="true">
          {showYou && (
            <p className="hm-voice-you">
              <Words key={`y${you}`} text={you} play={live && phase === "listen"} gap={YOU_GAP} />
            </p>
          )}
          {showJota && (
            <p className="hm-voice-jota">
              <Words key={`j${jota}`} text={jota} play={live && phase === "talk"} gap={JOTA_GAP} />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
