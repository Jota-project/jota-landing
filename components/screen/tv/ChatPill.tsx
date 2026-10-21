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
}: {
  open: boolean;
  turn: Turn;
  state: TurnState;
  orb: Parameters<typeof Orb>[0]["state"];
  onReplay?: () => void;
  replayLabel: string;
}) {
  return (
    <Glass
      open={open}
      form="pill"
      orb={orb}
      footer={state.jota && onReplay ? <ReplayButton label={replayLabel} onClick={onReplay} /> : null}
    >
      <TurnView turn={turn} state={state} active compact />
    </Glass>
  );
}
