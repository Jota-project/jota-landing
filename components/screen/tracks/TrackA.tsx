"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { useInView, useReducedMotion, useScript, useTrackProgress } from "../hooks";
import { TvFrame } from "../tv/TvFrame";
import type { GrowPhase } from "../tv/GrowTile";
import { Scene1Tv, Scene2Tv, Scene3Tv } from "./ScenesA";
import { SCENE2, SCENE3 } from "./scriptsA";

type Scene = 1 | 2 | 3;
const ALL2 = new Set(SCENE2.map((e) => e.id));
const ALL3 = new Set(SCENE3.map((e) => e.id));
const noop = () => {};
// a horizontal line across the middle of the viewport decides the active scene
const MID = { rootMargin: "-50% 0px -50% 0px" };

/** Track progress (0–1) at which the «El faro» tile leaves Inicio, fills the TV and gives way
 *  to the series. Scenes are 120/260/200svh tall, so the track scrolls 480svh. */
function growAt(p: number): GrowPhase {
  if (p < 0.17) return "hidden";
  if (p < 0.19) return "small";
  if (p < 0.23) return "full";
  return "gone";
}

/** Leaf that owns the per-frame progress (and --p), so only discrete changes reach the track. */
function Progress({ track, onGrow }: { track: RefObject<HTMLElement | null>; onGrow: (g: GrowPhase) => void }) {
  const p = useTrackProgress(track);
  const g = growAt(p);
  // the text switches ink → linen once, when the dusk layer (--p1 = p·6) passes half
  const dark = p * 6 >= 0.5;
  useEffect(() => onGrow(g), [g, onGrow]);
  useEffect(() => {
    track.current?.setAttribute("data-dark", dark ? "true" : "false");
  }, [dark, track]);
  return null;
}

function Transcript({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <ol className="sr-only">
      {lines.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ol>
  );
}

/** Tramo A · scenes 1–3: one sticky TV from the idle screen to the series and the glass panel. */
export function TrackA() {
  const t = useTranslations("screen");
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const r1 = useRef<HTMLElement>(null);
  const r2 = useRef<HTMLElement>(null);
  const r3 = useRef<HTMLElement>(null);
  const v1 = useInView(r1, MID);
  const v2 = useInView(r2, MID);
  const v3 = useInView(r3, MID);
  const trackView = useInView(track);
  const [grow, setGrow] = useState<GrowPhase>("hidden");

  useEffect(() => {
    track.current?.closest(".jscreen")?.setAttribute("data-hydrated", "");
  }, []);

  const active: Scene = v3.inView ? 3 : v2.inView ? 2 : v1.inView ? 1 : v3.passed ? 3 : v2.passed ? 2 : 1;

  // a scene plays once when it becomes active; leaving it (either way) jumps to its final state
  const [started, setStarted] = useState({ 2: false, 3: false });
  const ready2 = grow === "gone";
  const play2 = active === 2 && ready2;
  const play3 = active === 3;
  if ((play2 && !started[2]) || (play3 && !started[3])) {
    setStarted({ 2: started[2] || play2, 3: started[3] || play3 });
  }
  const skip2 = active !== 2 && (started[2] || active > 2);
  const skip3 = active !== 3 && started[3];
  const s2 = useScript(SCENE2, { play: play2, skip: skip2 });
  const s3 = useScript(SCENE3, { play: play3, skip: skip3 });
  // once started or skipped, scene 2 always shows its series (never back to Inicio)
  const final2 = reduced || started[2] || active > 2;

  const say = (done: Set<string>, pairs: [string, string][]) =>
    pairs.filter(([id]) => done.has(id)).map(([, line]) => line);
  const lines2 = say(s2.done, [
    ["you1", t("chat.series1You")],
    ["jota1", t("chat.series1Jota")],
    ["you2", t("chat.series2You")],
    ["jota2", t("chat.series2Jota")],
    ["activity", `${t("tv.activityLabel")} · ${t("tv.activityTime")}`],
  ]);
  const lines3 = say(s3.done, [
    ["you1", t("chat.jazzYou")],
    ["jota1", t("chat.jazzJota")],
    ["you2", t("chat.recipeYou")],
    ["jota2", t("chat.recipeJota")],
  ]);

  const tv = (scene: Scene, staticFrame = false) => {
    if (scene === 1) return <Scene1Tv />;
    if (scene === 2)
      return (
        <Scene2Tv
          done={staticFrame ? ALL2 : s2.done}
          finished={staticFrame || s2.finished}
          animate={!staticFrame && play2 && !s2.finished}
          onReplay={staticFrame ? noop : s2.replay}
          grow={staticFrame || final2 ? "gone" : grow}
          live={!staticFrame && active === 2 && trackView.inView}
        />
      );
    return (
      <Scene3Tv
        done={staticFrame ? ALL3 : s3.done}
        finished={staticFrame || s3.finished}
        animate={!staticFrame && play3 && !s3.finished}
        onReplay={staticFrame ? noop : s3.replay}
        activity={staticFrame || s2.done.has("activity")}
      />
    );
  };

  const caption = (scene: Scene, on2: boolean) => (
    <>
      <p data-phase="1" data-on="true">
        {t(`s${scene}.caption1`)}
      </p>
      <p data-phase="2" data-on={on2 ? "true" : "false"}>
        {t(`s${scene}.caption2`)}
      </p>
    </>
  );

  const heading = (
    <>
      <h1 className="font-display text-4xl font-medium md:text-5xl">{t("s1.headline")}</h1>
      <p className="ta-sub mt-4 text-lg">{t("s1.subhead")}</p>
      <p className="mt-8">{t("s1.caption")}</p>
    </>
  );

  if (reduced) {
    // reduced motion: no sticky, one still frame per scene with its text
    return (
      <div ref={track} className="ta ta-still">
        {([1, 2, 3] as Scene[]).map((n) => (
          <section key={n} id={`s${n}`} data-scene={n} data-dark={n === 1 ? "false" : "true"} className="ta-row">
            <div className="ta-cap">
              {n === 1 ? heading : caption(n, true)}
              <Transcript lines={n === 2 ? lines2 : n === 3 ? lines3 : []} />
            </div>
            <TvFrame>{tv(n, true)}</TvFrame>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div ref={track} className="ta" data-active={active}>
      <Progress track={track} onGrow={setGrow} />
      <i className="ta-dusk" aria-hidden="true" />
      <div className="ta-grid">
        <div className="ta-tv">
          <div className="ta-tv-in">
            <TvFrame paused={!trackView.inView}>{tv(active)}</TvFrame>
          </div>
        </div>
        <section id="s1" ref={r1} data-scene="1" className="ta-scene">
          <div className="ta-cap">{heading}</div>
        </section>
        <section id="s2" ref={r2} data-scene="2" className="ta-scene">
          <div className="ta-cap">
            {caption(2, s2.done.has("activity"))}
            <Transcript lines={lines2} />
          </div>
        </section>
        <section id="s3" ref={r3} data-scene="3" className="ta-scene">
          <div className="ta-cap">
            {caption(3, s3.done.has("jota1"))}
            <Transcript lines={lines3} />
          </div>
        </section>
      </div>
    </div>
  );
}
