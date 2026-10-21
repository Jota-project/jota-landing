"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { useInView, useReducedMotion, useTrackProgress } from "../hooks";
import { TvFrame } from "../tv/TvFrame";
import type { GrowPhase } from "../tv/GrowTile";
import { Scene1Tv, Scene2Tv, Scene3Tv } from "./ScenesA";
import { SCENE2, SCENE3, eventsDone, firstEvents, readsAlong } from "./scriptsA";

type Scene = 1 | 2 | 3;
const ALL2 = new Set(SCENE2.map((e) => e.id));
const ALL3 = new Set(SCENE3.map((e) => e.id));
// a horizontal line across the middle of the viewport decides the active scene
const MID = { rootMargin: "-50% 0px -50% 0px" };

/** Where a scene sits in the track (px): track height, viewport height, top and height of its section. */
export type Geo = { trackH: number; viewH: number; top: number; height: number };

/** Screens scrolled since a scene's top crossed the middle of the viewport (when it takes the TV), from the track
 *  progress p and the layout. Works for any heights; with no layout yet it is far past the scene's end. */
export function scrolledIn(p: number, geo: Geo): number {
  if (geo.height <= 0 || geo.viewH <= 0) return 99;
  const scroll = p * Math.max(0, geo.trackH - geo.viewH);
  return (scroll + geo.viewH / 2 - geo.top) / geo.viewH;
}

/** Screens into scene 2 at which the «El faro» tile starts filling the TV (and the script starts, over it), and at
 *  which it has filled it and gives way to the series. */
export const GROW_FULL = 0.25;
export const GROW_END = 0.7;

/** The «El faro» tile leaves Inicio, fills the TV and gives way to the series over scene 2's first screen,
 *  measured in screens (not in fractions of the scene, so a taller scene does not stretch it). It stays full
 *  for .45 screen (~1.1 s at a calm pace), long enough for its 1.3 s grow (its curve has settled by then). */
export function growAt(d: number): GrowPhase {
  if (d < 0.1) return "hidden";
  if (d < GROW_FULL) return "small";
  if (d < GROW_END) return "full";
  return "gone";
}

/** The opening (--p1, 0–1): the TV grows and the linen turns dusk over scene 1, eased in and out, done by the time
 *  scene 2 takes the TV (90 % of the way there). Measured, so it does not depend on the track's length; 0 until
 *  the layout is measured. */
export function openingAt(p: number, geo: Geo): number {
  // no layout yet (first frame): still at the start, linen; never a flash of dusk
  if (geo.viewH <= 0 || geo.height <= 0) return 0;
  const end = (geo.top - geo.viewH / 2) * 0.9;
  if (end <= 0) return 1;
  const scroll = p * Math.max(0, geo.trackH - geo.viewH);
  const x = Math.min(1, Math.max(0, scroll / end));
  return x * x * (3 - 2 * x);
}

const NO_GEO: Geo = { trackH: 0, viewH: 0, top: 0, height: 0 };

/** Measures a scene inside the track (on mount and whenever the track resizes). */
function useGeo(track: RefObject<HTMLElement | null>, scene: RefObject<HTMLElement | null>): Geo {
  const [geo, setGeo] = useState<Geo>(NO_GEO);
  useEffect(() => {
    const el = track.current;
    const s2 = scene.current;
    if (!el || !s2) return;
    const measure = () => {
      const a = el.getBoundingClientRect();
      const b = s2.getBoundingClientRect();
      const next = { trackH: a.height, viewH: window.innerHeight, top: b.top - a.top, height: b.height };
      setGeo((g) =>
        g.trackH === next.trackH && g.viewH === next.viewH && g.top === next.top && g.height === next.height ? g : next,
      );
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(el);
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [track, scene]);
  return geo;
}

/** What the track lifts from the scroll: the tile's phase, how many events of each script are done and whether the
 *  newest ones were read along (their words animate). */
export type StepA = { grow: GrowPhase; n2: number; n3: number; a2: boolean; a3: boolean };

/** Screens a second over the last SPEED_WINDOW ms, from the positions seen (t in ms) and the time now. */
export const SPEED_WINDOW = 300;
export function speedOf(samples: { t: number; q: number }[], now: number, q: number): number {
  let base = samples[0];
  for (const s of samples) if (s.t <= now - SPEED_WINDOW) base = s;
  if (!base) return 0;
  return Math.abs(q - base.q) / (SPEED_WINDOW / 1000);
}

const clamp = (v: number, hi: number) => Math.min(hi, Math.max(0, v));

/** Leaf that owns the per-frame progress (and --p, --p1, --q2, --q3), so only discrete steps reach the track. */
function Progress({
  track,
  scene2,
  scene3,
  onStep,
}: {
  track: RefObject<HTMLElement | null>;
  scene2: RefObject<HTMLElement | null>;
  scene3: RefObject<HTMLElement | null>;
  onStep: (s: StepA) => void;
}) {
  const p = useTrackProgress(track);
  const geo2 = useGeo(track, scene2);
  const geo3 = useGeo(track, scene3);
  const q2 = scrolledIn(p, geo2);
  const q3 = scrolledIn(p, geo3);
  const grow = growAt(q2);
  const n2 = eventsDone(SCENE2, q2).size;
  const n3 = eventsDone(SCENE3, q3).size;
  const p1 = openingAt(p, geo2);
  // the text switches ink → linen once, when the dusk layer passes half
  const dark = p1 >= 0.5;
  const samples = useRef<{ t: number; q: number }[]>([]);
  const last = useRef<StepA>({ grow: "hidden", n2: -1, n3: -1, a2: false, a3: false });
  useEffect(() => {
    const el = track.current;
    if (el) {
      el.style.setProperty("--p1", String(p1));
      el.setAttribute("data-dark", dark ? "true" : "false");
      // screens into scenes 2 and 3, for what follows the scroll inside them (the series and song bars)
      el.style.setProperty("--q2", String(clamp(q2, 4)));
      el.style.setProperty("--q3", String(clamp(q3, 4)));
    }
    const now = typeof performance === "undefined" ? Date.now() : performance.now();
    const seen = samples.current;
    const speed = speedOf(seen, now, q2);
    seen.push({ t: now, q: q2 });
    while (seen.length > 2 && seen[1].t <= now - SPEED_WINDOW) seen.shift();
    const L = last.current;
    const a2 = n2 === L.n2 ? L.a2 : readsAlong(SCENE2, L.n2, n2, q2, speed);
    const a3 = n3 === L.n3 ? L.a3 : readsAlong(SCENE3, L.n3, n3, q3, speed);
    if (grow !== L.grow || n2 !== L.n2 || n3 !== L.n3 || a2 !== L.a2 || a3 !== L.a3) {
      last.current = { grow, n2, n3, a2, a3 };
      onStep(last.current);
    }
  }, [track, p1, dark, q2, q3, grow, n2, n3, onStep]);
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

/** Tramo A · scenes 1–3: one sticky TV from the idle screen to the series and the glass panel. The conversations of
 *  scenes 2 and 3 follow the scroll: each event has its place in the scene, both ways. */
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
  const [step, setStep] = useState<StepA>({ grow: "hidden", n2: 0, n3: 0, a2: false, a3: false });
  const [ring, setRing] = useState(1);

  useEffect(() => {
    track.current?.closest(".jscreen")?.setAttribute("data-hydrated", "");
  }, []);

  const active: Scene = v3.inView ? 3 : v2.inView ? 2 : v1.inView ? 1 : v3.passed ? 3 : v2.passed ? 2 : 1;
  const done2 = useMemo(() => firstEvents(SCENE2, step.n2), [step.n2]);
  const done3 = useMemo(() => firstEvents(SCENE3, step.n3), [step.n3]);
  const finished2 = step.n2 >= SCENE2.length;
  const finished3 = step.n3 >= SCENE3.length;
  // a new scene fades in over the black of the TV (not on the first frame)
  const [shown, setShown] = useState<Scene>(active);
  const [fade, setFade] = useState(false);
  if (shown !== active) {
    setShown(active);
    setFade(true);
  }
  const grow2: GrowPhase = reduced ? "gone" : step.grow;

  // the activity ring counts down from its birth in scene 2, through scene 3, while the track is on screen
  const born = done2.has("activity");
  if (!born && ring !== 1) setRing(1);
  const counting = born && trackView.inView && !reduced;
  useEffect(() => {
    if (!counting) return;
    const id = setInterval(() => setRing((v) => Math.max(0.55, v - 0.008)), 1000);
    return () => clearInterval(id);
  }, [counting]);

  const say = (done: Set<string>, pairs: [string, string][]) =>
    pairs.filter(([id]) => done.has(id)).map(([, line]) => line);
  const lines2 = say(reduced ? ALL2 : done2, [
    ["you1", t("chat.series1You")],
    ["jota1", t("chat.series1Jota")],
    ["you2", t("chat.series2You")],
    ["jota2", t("chat.series2Jota")],
    ["activity", `${t("tv.activityLabel")} · ${t("tv.activityTime")}`],
  ]);
  const lines3 = say(reduced ? ALL3 : done3, [
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
          done={staticFrame ? ALL2 : done2}
          finished={staticFrame || finished2}
          animate={!staticFrame && step.a2}
          ring={staticFrame ? 1 : ring}
          grow={staticFrame ? "gone" : grow2}
          live={!staticFrame && active === 2 && trackView.inView}
        />
      );
    return (
      <Scene3Tv
        done={staticFrame ? ALL3 : done3}
        finished={staticFrame || finished3}
        animate={!staticFrame && step.a3}
        ring={staticFrame ? 1 : ring}
        activity={staticFrame || born}
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
      <div ref={track} className="ta ta-still" data-sticky="false">
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
    <div ref={track} className="ta" data-sticky="true" data-active={active}>
      <Progress track={track} scene2={r2} scene3={r3} onStep={setStep} />
      <i className="ta-dusk" aria-hidden="true" />
      <div className="ta-grid">
        <div className="ta-tv">
          <div className="ta-tv-in">
            <TvFrame paused={!trackView.inView}>
              <div key={active} className="ta-scr" data-fade={fade ? "true" : "false"}>
                {tv(active)}
              </div>
            </TvFrame>
            {/* a fine line under the TV that follows the scroll through the track */}
            <i className="ta-meter" aria-hidden="true" />
          </div>
        </div>
        <section id="s1" ref={r1} data-scene="1" className="ta-scene">
          <div className="ta-cap">{heading}</div>
        </section>
        <section id="s2" ref={r2} data-scene="2" className="ta-scene">
          <div className="ta-cap">
            {caption(2, done2.has("activity"))}
            <Transcript lines={lines2} />
          </div>
        </section>
        <section id="s3" ref={r3} data-scene="3" className="ta-scene">
          <div className="ta-cap">
            {caption(3, done3.has("jota1"))}
            <Transcript lines={lines3} />
          </div>
        </section>
      </div>
    </div>
  );
}
