import type { ScriptEvent } from "../hooks";
import type { TurnState } from "../tv/GlassPanel";

// Pace (see tests/screen-ritmo): your words go at YOU_GAP, Jota's at JOTA_GAP; a tool card comes ~.5 s after
// your last word; the next turn waits ≥2.5 s after the last word of Jota's answer, so it can be read.

/** Scene 2 · the series: two turns in the top pill, then the live activity is born (ms). */
export const SCENE2: ScriptEvent[] = [
  { at: 500, id: "you1" },
  { at: 1900, id: "tool1" },
  { at: 3000, id: "toolDone1" },
  { at: 3400, id: "jota1" },
  { at: 8200, id: "you2" },
  { at: 10100, id: "tool2" },
  { at: 11200, id: "toolDone2" },
  { at: 11600, id: "jota2" },
  { at: 14100, id: "activity" },
];

/** Scene 3 · spare screen: music from the first turn, the recipe web from the second (ms). */
export const SCENE3: ScriptEvent[] = [
  { at: 500, id: "you1" },
  { at: 2900, id: "tool1" },
  { at: 3300, id: "music" },
  { at: 4100, id: "toolDone1" },
  { at: 4500, id: "jota1" },
  { at: 9300, id: "you2" },
  { at: 11700, id: "tool2" },
  { at: 12100, id: "grow" },
  { at: 13400, id: "web" },
  { at: 13900, id: "toolDone2" },
  { at: 14300, id: "jota2" },
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
