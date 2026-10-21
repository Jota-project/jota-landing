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

/** Reading along: a line animates while the scroll is less than this past its event; further on (a jump, or simply
 *  reading on) it is painted whole, so every answer is seen whole for a while before the next turn. */
export const STEP_MAX = 0.2;
/** Faster than this (screens a second) the visitor is skimming: lines come out whole. */
export const FAST = 2.5;

/** Whether what just appeared animates its words: the scene moved forward (from prev to next events done) at a
 *  reading speed, and q is still close to the first event it crossed. Jumps (landing far past, the first measure
 *  with no layout) and scrolling back paint the words whole. */
export function readsAlong(events: ScriptEvent[], prev: number, next: number, q: number, speed: number): boolean {
  if (next <= prev || prev < 0 || prev >= events.length) return false;
  if (speed > FAST) return false;
  return q - events[prev].pos < STEP_MAX;
}

/** Whether the newest of the n events done is still close enough to animate (see STEP_MAX). */
export function stillReading(events: ScriptEvent[], n: number, q: number): boolean {
  return n >= 1 && n <= events.length && q - events[n - 1].pos < STEP_MAX;
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
