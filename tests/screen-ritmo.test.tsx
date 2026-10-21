import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import es from "../messages/es.json";
import en from "../messages/en.json";
import { SCENE2, SCENE3 } from "@/components/screen/tracks/scriptsA";
import { JOTA_GAP, YOU_GAP } from "@/components/screen/tv/Words";
import { TurnView, type Turn } from "@/components/screen/tv/GlassPanel";
import { GROW_END, HOLD_LINE, growAt, openingAt, scrolledIn } from "@/components/screen/tracks/TrackA";
import { FLY_FROM, FLY_SPAN } from "@/components/screen/tracks/ScenesB";
import { digitsAt, phaseOf } from "@/components/screen/tracks/TrackB";

afterEach(() => {
  vi.useRealTimers();
});

type ChatKey = keyof typeof es.screen.chat;
const words = (t: string) => t.split(" ").filter(Boolean).length;
/** The longer of es/en, so the pause holds in both languages. */
const longest = (k: ChatKey) => Math.max(words(es.screen.chat[k]), words(en.screen.chat[k]));
const at = (sc: { at: number; id: string }[], id: string) => sc.find((e) => e.id === id)!.at;
/** When the last word of a line appears. */
const lastWord = (start: number, k: ChatKey, gap: number) => start + (longest(k) - 1) * gap;

const LINES: [typeof SCENE2, [ChatKey, ChatKey, ChatKey, ChatKey]][] = [
  [SCENE2, ["series1You", "series1Jota", "series2You", "series2Jota"]],
  [SCENE3, ["jazzYou", "jazzJota", "recipeYou", "recipeJota"]],
];

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

  for (const [sc, [you1, jota1, you2, jota2]] of LINES) {
    const name = sc === SCENE2 ? "scene 2" : "scene 3";
    it(`${name}: tools wait for your words, ≥2.5 s to read each answer before the next turn`, () => {
      // the tool card comes once you have finished speaking
      expect(at(sc, "tool1")).toBeGreaterThanOrEqual(lastWord(at(sc, "you1"), you1, YOU_GAP) + 400);
      expect(at(sc, "tool2")).toBeGreaterThanOrEqual(lastWord(at(sc, "you2"), you2, YOU_GAP) + 400);
      // between Jota's answer and your next turn: the event gap and, more, a real pause after its last word
      expect(at(sc, "you2") - at(sc, "jota1")).toBeGreaterThanOrEqual(2500);
      expect(at(sc, "you2") - lastWord(at(sc, "jota1"), jota1, JOTA_GAP)).toBeGreaterThanOrEqual(2500);
      expect(lastWord(at(sc, "jota2"), jota2, JOTA_GAP)).toBeGreaterThan(at(sc, "toolDone2"));
    });
  }

  it("scene 2: ≥1.5 s after the last answer before the activity is born", () => {
    expect(at(SCENE2, "activity") - lastWord(at(SCENE2, "jota2"), "series2Jota", JOTA_GAP)).toBeGreaterThanOrEqual(1500);
  });

  it("scene 3: the recipe web opens once the tile has grown (~1.3 s)", () => {
    expect(at(SCENE3, "web") - at(SCENE3, "grow")).toBeGreaterThanOrEqual(1300);
  });

  it("the second caption comes ≥2 s into the scene (time to read the first)", () => {
    // TrackA turns caption2 on with these events
    expect(at(SCENE2, "activity")).toBeGreaterThanOrEqual(2000);
    expect(at(SCENE3, "jota1")).toBeGreaterThanOrEqual(2000);
  });
});

describe("the scroll leaves time", () => {
  const css = (f: string) => readFileSync(path.resolve(process.cwd(), "components/screen", f), "utf-8");
  const a = css("screen-track-a.css");
  const mobile = a.slice(a.indexOf("@media (max-width:1023px)"));
  const h = (src: string, id: string) => Number(src.match(new RegExp(`#${id}\\.ta-scene\\{(?:grid-row:\\d;)?min-height:(\\d+)svh`))![1]) / 100;
  // a calm reader: one screen every 2.5 s
  const PACE = 2500;
  const end2 = at(SCENE2, "activity");
  const end3 = lastWord(at(SCENE3, "jota2"), "recipeJota", JOTA_GAP);

  for (const [label, src] of [["desktop", a], ["mobile", mobile]] as const) {
    it(`${label}: each script ends inside its scene at one screen every 2.5 s`, () => {
      // scene 2 plays once the tile has grown and holds the TV until scene 3 covers all but HOLD_LINE of the screen
      expect((h(src, "s2") - GROW_END + HOLD_LINE) * PACE).toBeGreaterThanOrEqual(end2);
      // scene 3 starts at mid-screen; the TV leaves with the track's bottom (half a screen early), held until
      // HOLD_LINE of it has gone
      expect((h(src, "s3") - 0.5 + HOLD_LINE) * PACE).toBeGreaterThanOrEqual(end3);
    });
  }

  it("tracks B, C and D are longer: s4/s5 300svh, C and D 220svh", () => {
    const b = css("screen-track-b.css");
    expect(b).toMatch(/#s4\.tb-scene\{grid-row:1;min-height:300svh\}/);
    expect(b).toMatch(/#s5\.tb-scene\{grid-row:2;min-height:300svh\}/);
    const end = css("screen-end.css");
    expect(end).toMatch(/\.jscreen \.tck\{position:relative;height:220svh/);
    expect(end).toMatch(/\.jscreen \.tdk\{position:relative;height:220svh/);
  });
});

describe("scroll-driven phases", () => {
  it("the tile grows over the first screen of scene 2, measured in screens (any scene height)", () => {
    expect(growAt(-0.01)).toBe("hidden");
    expect(growAt(0.05)).toBe("hidden");
    expect(growAt(0.15)).toBe("small");
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
    expect(openingAt(0.5, { trackH: 0, viewH: 0, top: 0, height: 0 })).toBe(1);
  });

  it("track B: each remote phase and the code get more scroll", () => {
    expect(phaseOf(0)).toBe("trackpad");
    expect(phaseOf(0.13)).toBe("trackpad");
    expect(phaseOf(0.2)).toBe("controls");
    expect(phaseOf(0.3)).toBe("type");
    expect(phaseOf(0.45)).toBe("talk");
    expect(phaseOf(0.5)).toBe("pair");
    expect(phaseOf(0.85)).toBe("pair");
    expect(phaseOf(0.9)).toBe("roles");
    // with s4 = s5 = 300svh (span 500svh), s5 reaches mid-screen at p = .5: pairing starts just before
    const handoff = (300 - 50) / (600 - 100);
    expect(phaseOf(handoff - 0.02)).toBe("talk");
    expect(phaseOf(handoff)).toBe("pair");
    // every remote phase gets ≥ .11 of the track (≥ .55 screen)
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
