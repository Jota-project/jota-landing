"use client";

import { Glass, ReplayButton, TurnView, type Turn, type TurnState } from "./GlassPanel";
import type { Orb } from "./Orb";

/** The conversation over video: a pill at the top that keeps only the last turn. */
export function ChatPill({
  open,
  turn,
  state,
  orb,
  onReplay,
  replayLabel,
  animate = true,
}: {
  open: boolean;
  turn: Turn;
  state: TurnState;
  orb: Parameters<typeof Orb>[0]["state"];
  onReplay?: () => void;
  replayLabel: string;
  /** false paints every word at once (final frames, no-JS render). */
  animate?: boolean;
}) {
  return (
    <Glass
      open={open}
      form="pill"
      orb={orb}
      footer={state.jota && onReplay ? <ReplayButton label={replayLabel} onClick={onReplay} /> : null}
    >
      <TurnView turn={turn} state={state} active={animate} compact />
    </Glass>
  );
}
