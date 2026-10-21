import type { TurnState } from "../tv/GlassPanel";

/** One step of a scene's script, at `pos` screens scrolled since the scene took the TV (its top crossed the
 *  middle of the viewport, as in scrolledIn). The scroll drives the script: no clock between events. */
export type ScriptEvent = { pos: number; id: string };

// Reading space in scroll (see tests/screen-ritmo): ~.25 screen from what you say to the tool and from the tool to
// Jota's answer, and .45 screen after each answer before the next turn, so it can be read calmly.
export const SAY_GAP = 0.25;
export const READ_GAP = 0.45;

/** Scene 2 · the series: two turns in the top pill (from the tile filling the TV), then the live activity. */
export const SCENE2: ScriptEvent[] = [
  { pos: 0.35, id: "you1" },
  { pos: 0.6, id: "tool1" },
  { pos: 0.72, id: "toolDone1" },
  { pos: 0.85, id: "jota1" },
  { pos: 1.3, id: "you2" },
  { pos: 1.55, id: "tool2" },
  { pos: 1.67, id: "toolDone2" },
  { pos: 1.8, id: "jota2" },
  { pos: 2.25, id: "activity" },
];

/** Scene 3 · spare screen: music from the first turn, the recipe web from the second (the tile grows .35 screen,
 *  ~1 s at a calm pace, before the web opens over it). */
export const SCENE3: ScriptEvent[] = [
  { pos: 0.25, id: "you1" },
  { pos: 0.5, id: "tool1" },
  { pos: 0.56, id: "music" },
  { pos: 0.62, id: "toolDone1" },
  { pos: 0.75, id: "jota1" },
  { pos: 1.2, id: "you2" },
  { pos: 1.45, id: "tool2" },
  { pos: 1.5, id: "grow" },
  { pos: 1.85, id: "web" },
  { pos: 1.95, id: "toolDone2" },
  { pos: 2.05, id: "jota2" },
];

/** What the scene has said at q screens into it: every event whose position has been passed. Both ways: scrolling
 *  back up takes events off again. */
export function eventsDone(events: ScriptEvent[], q: number): Set<string> {
  const done = new Set<string>();
  for (const e of events) if (e.pos <= q) done.add(e.id);
  return done;
}

/** The first n events (events are in order), as a done set. */
export function firstEvents(events: ScriptEvent[], n: number): Set<string> {
  return new Set(events.slice(0, Math.max(0, n)).map((e) => e.id));
}

/** A jump: landing this far past the first event crossed paints the words whole. */
export const STEP_MAX = 0.2;
/** Faster than this (screens a second) the visitor is skimming: lines come out whole. */
export const FAST = 2.5;
/** How long a Jota line may animate past its event, at most, and how much before the next event it is whole. */
export const JOTA_ANIM = 0.3;
export const JOTA_WHOLE = 0.2;

const isLine = (id: string) => id.startsWith("you") || id.startsWith("jota");

/** Where line i (a «you» or «jota» event) has to be whole: your words by your tool card; Jota's answer .2 screen
 *  before the next event and no later than .3 past its own, so it is read whole before the next turn.
 *  Undefined for other events. */
export function lineDeadline(events: ScriptEvent[], i: number): number | undefined {
  const e = events[i];
  if (!e || !isLine(e.id)) return undefined;
  const next = events[i + 1];
  if (e.id.startsWith("you")) {
    const tool = events.find((x) => x.id === `tool${e.id.slice(3)}`);
    return tool ? tool.pos : (next?.pos ?? e.pos + JOTA_ANIM);
  }
  return next ? Math.min(next.pos - JOTA_WHOLE, e.pos + JOTA_ANIM) : e.pos + JOTA_ANIM;
}

/** Whether the newest line among the first n events may still be animating at q (before its deadline). */
export function stillReading(events: ScriptEvent[], n: number, q: number): boolean {
  for (let i = Math.min(n, events.length) - 1; i >= 0; i--) {
    if (isLine(events[i].id)) return q < (lineDeadline(events, i) ?? -Infinity);
  }
  return false;
}

/** Whether what just appeared animates its words: the scene moved forward (from prev to next events done) at a
 *  reading speed, q is still close to the first event it crossed (not a jump: a restored scroll, the first measure
 *  with no layout) and before the newest line's deadline. Scrolling back paints the words whole. */
export function readsAlong(events: ScriptEvent[], prev: number, next: number, q: number, speed: number): boolean {
  if (next <= prev || prev < 0 || prev >= events.length) return false;
  if (speed > FAST) return false;
  if (q - events[prev].pos >= STEP_MAX) return false;
  return stillReading(events, next, q);
}

/** What turn n has said so far. */
export function turnState(done: Set<string>, n: 1 | 2): TurnState {
  return {
    you: done.has(`you${n}`),
    tool: done.has(`toolDone${n}`) ? "done" : done.has(`tool${n}`) ? "run" : "none",
    jota: done.has(`jota${n}`),
  };
}

/** Orb state from the latest event said: listening, thinking, talking, then idle. */
export function orbState(
  events: ScriptEvent[],
  done: Set<string>,
  finished: boolean,
): "idle" | "listen" | "think" | "talk" {
  if (finished) return "idle";
  let last = "";
  for (const e of events) if (done.has(e.id)) last = e.id;
  if (last.startsWith("you")) return "listen";
  if (last.startsWith("jota")) return "talk";
  if (!last || last === "activity") return "idle";
  return "think";
}
