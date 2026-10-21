import type { ScriptEvent } from "../hooks";
import type { TurnState } from "../tv/GlassPanel";

// Pace (see tests/screen-ritmo): your words go at YOU_GAP, Jota's at JOTA_GAP; a tool card comes .4 s after
// your last word and runs ~.7 s; the next turn waits ≥2.5 s after the last word of Jota's answer, so it can be read.

/** Scene 2 · the series: two turns in the top pill, then the live activity is born (ms). */
export const SCENE2: ScriptEvent[] = [
  { at: 300, id: "you1" },
  { at: 1660, id: "tool1" },
  { at: 2360, id: "toolDone1" },
  { at: 2760, id: "jota1" },
  { at: 7500, id: "you2" },
  { at: 9340, id: "tool2" },
  { at: 10040, id: "toolDone2" },
  { at: 10440, id: "jota2" },
  { at: 12900, id: "activity" },
];

/** Scene 3 · spare screen: music from the first turn, the recipe web from the second (ms). */
export const SCENE3: ScriptEvent[] = [
  { at: 300, id: "you1" },
  { at: 2620, id: "tool1" },
  { at: 3020, id: "music" },
  { at: 3320, id: "toolDone1" },
  { at: 3720, id: "jota1" },
  { at: 8460, id: "you2" },
  { at: 10780, id: "tool2" },
  { at: 11180, id: "grow" },
  { at: 12480, id: "web" },
  { at: 12980, id: "toolDone2" },
  { at: 13380, id: "jota2" },
];

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
