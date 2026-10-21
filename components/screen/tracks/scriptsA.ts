import type { ScriptEvent } from "../hooks";
import type { TurnState } from "../tv/GlassPanel";

/** Scene 2 · the series: two turns in the top pill, then the live activity is born (ms). */
export const SCENE2: ScriptEvent[] = [
  { at: 700, id: "you1" },
  { at: 2300, id: "tool1" },
  { at: 3600, id: "toolDone1" },
  { at: 4200, id: "jota1" },
  { at: 7800, id: "you2" },
  { at: 9800, id: "tool2" },
  { at: 10900, id: "toolDone2" },
  { at: 11500, id: "jota2" },
  { at: 12800, id: "activity" },
];

/** Scene 3 · spare screen: music from the first turn, the recipe web from the second (ms). */
export const SCENE3: ScriptEvent[] = [
  { at: 700, id: "you1" },
  { at: 2600, id: "tool1" },
  { at: 3100, id: "music" },
  { at: 4200, id: "toolDone1" },
  { at: 4900, id: "jota1" },
  { at: 8600, id: "you2" },
  { at: 10800, id: "tool2" },
  { at: 11300, id: "grow" },
  { at: 12300, id: "web" },
  { at: 13000, id: "toolDone2" },
  { at: 13600, id: "jota2" },
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
