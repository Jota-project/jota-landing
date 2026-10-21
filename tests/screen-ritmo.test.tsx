import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import es from "../messages/es.json";
import en from "../messages/en.json";
import { READ_GAP, SAY_GAP, SCENE2, SCENE3, type ScriptEvent } from "@/components/screen/tracks/scriptsA";
import { Scene2Tv } from "@/components/screen/tracks/ScenesA";
import { JOTA_GAP, YOU_GAP } from "@/components/screen/tv/Words";
import { TurnView, type Turn } from "@/components/screen/tv/GlassPanel";
import { GROW_END, GROW_FULL, growAt, openingAt, scrolledIn } from "@/components/screen/tracks/TrackA";
import { FLY_FROM, FLY_SPAN, TvB } from "@/components/screen/tracks/ScenesB";
import { digitsAt, phaseOf } from "@/components/screen/tracks/TrackB";

afterEach(() => {
  vi.useRealTimers();
});

const pos = (sc: ScriptEvent[], id: string) => sc.find((e) => e.id === id)!.pos;
const css = (f: string) => readFileSync(path.resolve(process.cwd(), "components/screen", f), "utf-8");

describe("reading pace", () => {
  it("you speak at ≥200 ms a word, Jota at ≥300 ms", () => {
    expect(YOU_GAP).toBeGreaterThanOrEqual(200);
    expect(JOTA_GAP).toBeGreaterThanOrEqual(300);
  });

  it("the glass paints your words at YOU_GAP and Jota's at JOTA_GAP", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const turn: Turn = { you: "uno dos tres cuatro", jota: "cinco seis siete ocho" };
    const { container, rerender } = render(
      <TurnView turn={turn} state={{ you: true, tool: "none", jota: false }} active compact={false} />,
    );
    const shown = (sel: string) => container.querySelectorAll(`${sel} .tv-w.in`).length;
    act(() => void vi.advanceTimersByTime(YOU_GAP - 10));
    expect(shown(".tv-u")).toBe(1);
    act(() => void vi.advanceTimersByTime(20));
    expect(shown(".tv-u")).toBe(2);
    rerender(<TurnView turn={turn} state={{ you: true, tool: "none", jota: true }} active compact={false} />);
    act(() => void vi.advanceTimersByTime(JOTA_GAP - 10));
    expect(shown(".tv-j")).toBe(1);
    act(() => void vi.advanceTimersByTime(20));
    expect(shown(".tv-j")).toBe(2);
  });

  it("a line that appears while not reading along (a jump, scrolling back) comes out whole", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const turn: Turn = { you: "uno dos tres cuatro", jota: "cinco seis siete ocho" };
    const view = (jota: boolean, active: boolean) => (
      <TurnView turn={turn} state={{ you: true, tool: "none", jota }} active={active} compact={false} />
    );
    const { container, rerender } = render(view(false, false));
    const shown = (sel: string) => container.querySelectorAll(`${sel} .tv-w.in`).length;
    expect(shown(".tv-u")).toBe(4);
    // reading along again: what is already there is not typed again; the new line animates
    rerender(view(true, true));
    expect(shown(".tv-u")).toBe(4);
    act(() => void vi.advanceTimersByTime(JOTA_GAP + 10));
    expect(shown(".tv-j")).toBe(2);
    expect(shown(".tv-u")).toBe(4);
    // skimming on mid-line: it completes at once
    rerender(view(true, false));
    expect(shown(".tv-j")).toBe(4);
  });
});

describe("the scroll drives the conversations", () => {
  const SCRIPTS: [string, ScriptEvent[]][] = [
    ["scene 2", SCENE2],
    ["scene 3", SCENE3],
  ];
  for (const [name, sc] of SCRIPTS) {
    it(`${name}: events in order, ~${SAY_GAP} screen you → tool → answer, ${READ_GAP} screen to read each answer`, () => {
      const p = sc.map((e) => e.pos);
      expect([...p].sort((x, y) => x - y)).toEqual(p);
      for (const n of [1, 2]) {
        expect(pos(sc, `tool${n}`) - pos(sc, `you${n}`)).toBeGreaterThanOrEqual(SAY_GAP - 1e-9);
        expect(pos(sc, `jota${n}`) - pos(sc, `tool${n}`)).toBeGreaterThanOrEqual(SAY_GAP - 1e-9);
        expect(pos(sc, `toolDone${n}`)).toBeGreaterThan(pos(sc, `tool${n}`));
        expect(pos(sc, `toolDone${n}`)).toBeLessThan(pos(sc, `jota${n}`));
      }
      expect(pos(sc, "you2") - pos(sc, "jota1")).toBeGreaterThanOrEqual(READ_GAP - 1e-9);
      // no stretch of a screen or more without a change
      for (let i = 1; i < p.length; i++) expect(p[i] - p[i - 1]).toBeLessThan(0.5);
    });
  }

  it("scene 2 starts over the tile once it fills the TV; the activity comes after time to read the last answer", () => {
    expect(pos(SCENE2, "you1")).toBeGreaterThan(GROW_FULL);
    expect(pos(SCENE2, "activity") - pos(SCENE2, "jota2")).toBeGreaterThanOrEqual(READ_GAP - 1e-9);
  });

  it("scene 3: the recipe web opens once the tile has grown (≥ .3 screen, ~1 s at a calm pace)", () => {
    expect(pos(SCENE3, "web") - pos(SCENE3, "grow")).toBeGreaterThanOrEqual(0.3);
  });

  it("the second caption comes on with its event, half a screen or more into the scene", () => {
    // TrackA turns caption2 on with these events
    expect(pos(SCENE2, "activity")).toBeGreaterThanOrEqual(0.5);
    expect(pos(SCENE3, "jota1")).toBeGreaterThanOrEqual(0.5);
    expect(css("screen-track-a.css")).toMatch(/\.ta-cap \[data-phase\]\{transition:opacity \.6s ease,transform \.6s/);
  });
});

describe("the tracks fit their script, and no more", () => {
  const a = css("screen-track-a.css");
  const mobile = a.slice(a.indexOf("@media (max-width:1023px)"));
  const h = (src: string, id: string) => Number(src.match(new RegExp(`#${id}\\.ta-scene\\{(?:grid-row:\\d;)?min-height:(\\d+)svh`))![1]) / 100;
  const end = (sc: ScriptEvent[]) => sc[sc.length - 1].pos + READ_GAP;

  for (const [label, src] of [["desktop", a], ["mobile", mobile]] as const) {
    it(`${label}: each script ends inside its scene with time to read it and some margin`, () => {
      // scene 2 holds the TV from its top crossing mid-screen until scene 3's does: h2 screens
      expect(h(src, "s2") - end(SCENE2)).toBeGreaterThanOrEqual(0.15);
      // scene 3 takes the TV at mid-screen and the TV leaves with the track's bottom, half a screen early (on mobile
      // the TV stays longer: this is the tighter bound)
      expect(h(src, "s3") - 0.5 - end(SCENE3)).toBeGreaterThanOrEqual(0.15);
      // and not much more: no long scroll with the script over
      expect(h(src, "s2") - end(SCENE2)).toBeLessThanOrEqual(0.6);
      expect(h(src, "s3") - 0.5 - end(SCENE3)).toBeLessThanOrEqual(0.6);
    });
  }

  it("lengths: s1 130, s2 300, s3 320svh (mobile s1 120); B s4/s5 240; C and D 170svh", () => {
    expect([h(a, "s1"), h(a, "s2"), h(a, "s3")]).toEqual([1.3, 3, 3.2]);
    expect([h(mobile, "s1"), h(mobile, "s2"), h(mobile, "s3")]).toEqual([1.2, 3, 3.2]);
    const b = css("screen-track-b.css");
    expect(b).toMatch(/#s4\.tb-scene\{grid-row:1;min-height:240svh\}/);
    expect(b).toMatch(/#s5\.tb-scene\{grid-row:2;min-height:240svh\}/);
    // mobile keeps the same length: each remote phase and the second caption need the same scroll
    const mb = b.slice(b.indexOf("@media (max-width:1023px)"));
    expect(mb).toMatch(/#s4\.tb-scene\{min-height:240svh\}/);
    expect(mb).toMatch(/#s5\.tb-scene\{min-height:240svh\}/);
    const e = css("screen-end.css");
    expect(e).toMatch(/\.jscreen \.tck\{position:relative;height:170svh/);
    expect(e).toMatch(/\.jscreen \.tdk\{position:relative;height:170svh/);
  });
});

describe("feedback while the TV is pinned", () => {
  const a = css("screen-track-a.css");
  const b = css("screen-track-b.css");
  const wrap = (ui: ReactNode) => (
    <NextIntlClientProvider locale="es" messages={es}>
      {ui}
    </NextIntlClientProvider>
  );
  const bar = (html: string) => html.match(/data-testid="tv-serie-bar"[^>]*style="([^"]*)"/)?.[1] ?? html.match(/style="([^"]*)"[^>]*data-testid="tv-serie-bar"/)?.[1];

  it("the series bar follows the scroll in scene 2 (--q2) and in track B (--p)", () => {
    const s2 = renderToString(wrap(<Scene2Tv done={new Set()} finished={false} animate={false} grow="gone" live={false} ring={1} />));
    expect(bar(s2)).toMatch(/scaleX\(calc\(\.32 \+ [.\d]+\*var\(--q2,0\)\)\)/);
    const tb = renderToString(wrap(<TvB phase="controls" playing={false} />));
    expect(bar(tb)).toMatch(/scaleX\(calc\(\.32 \+ [.\d]+\*var\(--p,0\)\)\)/);
  });

  it("the song bar follows the scroll in scene 3 (--q3)", () => {
    expect(a).toMatch(/\.ta \.tv-musica \.pr \.bar b\{transform:scaleX\(calc\(\.4 \+ [.\d]+\*var\(--q3,0\)\)\)\}/);
  });

  it("a fine line under the TV follows the scroll of tracks A and B (only once hydrated)", () => {
    for (const [src, cls] of [[a, "ta-meter"], [b, "tb-meter"]] as const) {
      expect(src).toMatch(new RegExp(`\\.${cls}::after\\{[^}]*transform:scaleX\\(var\\(--p,0\\)\\)`));
      expect(src).toMatch(new RegExp(`\\.jscreen:not\\(\\[data-hydrated\\]\\) \\.${cls}\\{display:none\\}`));
    }
    // in track B it is absolute: it does not move the mobile layout
    expect(b).toMatch(/\.tb-meter\{position:absolute/);
  });
});

describe("no Repetir: scrolling back up replays", () => {
  it("no replay button, label or hold line is left in the code or the messages", () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = path.join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx?|css)$/.test(f) && /chat\.replay|ReplayButton|replayLabel|onReplay|tv-replay|HOLD_LINE|useScript/.test(readFileSync(p, "utf-8"))) hits.push(p);
      }
    };
    walk(path.resolve(process.cwd(), "components/screen"));
    expect(hits).toEqual([]);
    expect("replay" in es.screen.chat).toBe(false);
    expect("replay" in en.screen.chat).toBe(false);
  });
});

describe("scroll-driven phases", () => {
  it("the tile grows over the first screen of scene 2, measured in screens (any scene height)", () => {
    expect(growAt(-0.01)).toBe("hidden");
    expect(growAt(0.05)).toBe("hidden");
    expect(growAt(0.15)).toBe("small");
    expect(growAt(GROW_FULL)).toBe("full");
    expect(growAt(0.4)).toBe("full");
    expect(growAt(GROW_END - 0.01)).toBe("full");
    expect(growAt(GROW_END)).toBe("gone");
    // the tile stays full for ≥0.4 screen: ~1 s at a calm pace, so its 1.3 s grow is seen
    let full = 0;
    for (let d = 0; d < 2; d += 0.01) if (growAt(d) === "full") full += 0.01;
    expect(full).toBeGreaterThanOrEqual(0.4);
    // screens past the moment scene 2's top crosses mid-screen
    const geo = { trackH: 14000, viewH: 900, top: 1440, height: 5580 };
    const span = geo.trackH - geo.viewH;
    expect(scrolledIn((1440 - 450) / span, geo)).toBeCloseTo(0);
    expect(scrolledIn((1440 - 450 + 450) / span, geo)).toBeCloseTo(0.5);
    expect(scrolledIn(0, { trackH: 0, viewH: 0, top: 0, height: 0 })).toBeGreaterThan(GROW_END);
  });

  it("the opening (TV grows, linen → dusk) eases in and ends before scene 2 takes the TV", () => {
    for (const geo of [
      { trackH: 14000, viewH: 900, top: 1440, height: 5580 },
      { trackH: 13000, viewH: 812, top: 1180, height: 4870 },
    ]) {
      const span = geo.trackH - geo.viewH;
      const atScroll = (y: number) => openingAt(y / span, geo);
      const active = geo.top - geo.viewH / 2;
      expect(atScroll(0)).toBe(0);
      expect(atScroll(active)).toBe(1);
      expect(atScroll(active * 0.9)).toBe(1);
      // eased: slow start, then monotonic
      expect(atScroll(active * 0.1)).toBeLessThan(0.1);
      let last = 0;
      for (let y = 0; y <= active; y += active / 40) {
        const v = atScroll(y);
        expect(v).toBeGreaterThanOrEqual(last);
        last = v;
      }
    }
    // first frame, nothing measured yet: linen, no flash of dusk
    expect(openingAt(0, { trackH: 0, viewH: 0, top: 0, height: 0 })).toBe(0);
    expect(openingAt(0.5, { trackH: 0, viewH: 0, top: 0, height: 0 })).toBe(0);
  });

  it("track B: each remote phase and the code get their share of the scroll", () => {
    expect(phaseOf(0)).toBe("trackpad");
    expect(phaseOf(0.13)).toBe("trackpad");
    expect(phaseOf(0.2)).toBe("controls");
    expect(phaseOf(0.3)).toBe("type");
    expect(phaseOf(0.45)).toBe("talk");
    expect(phaseOf(0.5)).toBe("pair");
    expect(phaseOf(0.85)).toBe("pair");
    expect(phaseOf(0.9)).toBe("roles");
    // with s4 = s5 = 240svh (span 380svh), s5 reaches mid-screen at p = .5: pairing starts just before
    const handoff = (240 - 50) / (480 - 100);
    expect(phaseOf(handoff - 0.02)).toBe("talk");
    expect(phaseOf(handoff)).toBe("pair");
    // every remote phase gets ≥ .11 of the track (≥ .4 screen)
    const len = (ph: string) => {
      let n = 0;
      for (let p = 0; p < 1; p += 0.001) if (phaseOf(p) === ph) n += 0.001;
      return n;
    };
    for (const ph of ["trackpad", "controls", "type", "talk"]) expect(len(ph), ph).toBeGreaterThanOrEqual(0.11);
    expect(len("pair")).toBeGreaterThanOrEqual(0.35);
    // the digits fly inside the pairing, all four before the roles
    expect(phaseOf(FLY_FROM)).toBe("pair");
    expect(phaseOf(FLY_FROM + 4 * FLY_SPAN)).toBe("pair");
    expect(digitsAt(FLY_FROM)).toBe(0);
    expect(digitsAt(FLY_FROM + FLY_SPAN)).toBe(1);
    expect(digitsAt(FLY_FROM + 2 * FLY_SPAN)).toBe(2);
    expect(digitsAt(FLY_FROM + 4 * FLY_SPAN)).toBe(4);
    expect(digitsAt(1)).toBe(4);
  });
});

describe("recipe", () => {
  it("the old rice recipe is gone from every file in the repo", () => {
    const word = new RegExp(["pae", "lla"].join(""), "i");
    const skip = new Set(["node_modules", ".next", ".git", ".superpowers", "coverage"]);
    const text = /\.(tsx?|jsx?|mjs|cjs|json|css|md|mdx|html|txt|svg|ya?ml)$/;
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        if (skip.has(f)) continue;
        const p = path.join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (text.test(f) && word.test(readFileSync(p, "utf-8"))) hits.push(p);
      }
    };
    walk(process.cwd());
    expect(hits).toEqual([]);
  });

  it("the recipe is a roasted pumpkin soup in both languages", () => {
    expect(es.screen.tv.recipeTitle).toBe("Crema de calabaza asada");
    expect(en.screen.tv.recipeTitle).toBe("Roasted pumpkin soup");
    expect(es.screen.chat.recipeYou).toMatch(/crema de calabaza asada/);
    expect(en.screen.chat.recipeYou).toMatch(/roasted pumpkin soup/);
  });
});

describe("track B on mobile", () => {
  const b = readFileSync(path.resolve(process.cwd(), "components/screen/screen-track-b.css"), "utf-8");
  const mobile = b.slice(b.indexOf("@media (max-width:1023px)"));
  /** Evaluates a CSS length (calc/max/var, vw and rem) in px at a viewport width. */
  const px = (expr: string, vw: number, vars: Record<string, string>): number => {
    let e = expr;
    for (let i = 0; i < 10 && /var\(/.test(e); i++) e = e.replace(/var\((--[\w-]+)\)/g, (_, v) => `(${vars[v]})`);
    e = e
      .replace(/calc\(/g, "(")
      .replace(/max\(/g, "Math.max(")
      .replace(/([\d.]+)vw/g, `($1*${vw / 100})`)
      .replace(/([\d.]+)rem/g, "($1*16)")
      .replace(/([\d.]+)px/g, "$1");
    if (/[a-z-]{3,}/i.test(e.replace(/Math\.max/g, ""))) throw new Error(`cannot evaluate ${e}`);
    return Function(`return ${e}`)();
  };
  const vars: Record<string, string> = {};
  for (const m of mobile.matchAll(/(--tb-[\w-]+):((?:[^;{}()]|\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))+)[;}]/g)) vars[m[1]] = m[2];
  const rule = (sel: string, prop: string) => mobile.match(new RegExp(`${sel}\\{[^}]*?${prop}:([^;}]+)`))![1];

  for (const vw of [375, 393]) {
    it(`the phone stays above the caption text at ${vw}px`, () => {
      // the stage starts under the nav (4rem) and the sticky's .5rem padding
      const phoneBottom = 72 + px(vars["--tb-phb"], vw, vars);
      // the smallest caption padding (short screens) is 1rem
      const textTop = px(rule("\\.jscreen \\.tb-cap", "top"), vw, vars) + 16;
      expect(phoneBottom).toBeLessThanOrEqual(textTop);
      // the sticky block (TV, phone and reserved space) ends where the caption starts
      const stageBottom = 72 + px(vars["--tb-tvh"], vw, vars) + px(rule("\\.jscreen \\.tb-stage", "padding-bottom"), vw, vars);
      expect(stageBottom).toBeCloseTo(px(rule("\\.jscreen \\.tb-cap", "top"), vw, vars));
      // the phone sits where --tb-pht says and is 26vw wide
      expect(rule("\\.jscreen \\.tb-phone", "top")).toBe("var(--tb-pht)");
      expect(rule("\\.jscreen \\.tb-phone", "width")).toBe("26vw");
    });
  }

  it("the phone enters with opacity only on mobile (no shift down onto the text)", () => {
    expect(mobile).toMatch(/\.jscreen\[data-hydrated\] \.tb-live \.tb-phone\{transform:none\}/);
  });
});
