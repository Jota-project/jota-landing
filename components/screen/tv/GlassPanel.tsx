"use client";

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "../hooks";
import { Orb } from "./Orb";
import { ToolCard } from "./ToolCard";
import { Words } from "./Words";
import { createSpringGlass, type SpringGlass } from "./glass";

/** Swells the glass and the orb (no-op outside a Glass). */
export const KickContext = createContext<(a: number) => void>(() => {});

export type Turn = {
  you: string;
  tool?: { icon: Parameters<typeof ToolCard>[0]["icon"]; title: string; sub?: string };
  jota: string;
};
export type TurnState = { you: boolean; tool: "none" | "run" | "done"; jota: boolean };
type OrbState = Parameters<typeof Orb>[0]["state"];

/** One turn: what you said, the tool card, Jota's answer. Only the parts already said are in the DOM. */
export function TurnView({
  turn,
  state,
  active,
  compact,
}: {
  turn: Turn;
  state: TurnState;
  /** Animate the words (false paints them all). */
  active: boolean;
  compact: boolean;
}) {
  const kick = useContext(KickContext);
  const sayWord = useCallback(() => kick(0.6), [kick]);
  useEffect(() => {
    if (active && state.tool !== "none") kick(1);
  }, [active, state.tool, kick]);
  return (
    <div className="tv-tn">
      {state.you && (
        <p className="tv-u">
          <Words text={turn.you} play={active} gap={110} />
        </p>
      )}
      {turn.tool && state.tool !== "none" && (
        <ToolCard
          icon={turn.tool.icon}
          title={turn.tool.title}
          sub={turn.tool.sub}
          state={state.tool === "done" ? "done" : "run"}
          compact={compact}
        />
      )}
      {state.jota && (
        <p className="tv-j">
          <Words text={turn.jota} play={active} onWord={sayWord} />
        </p>
      )}
    </div>
  );
}

/** Shared glass (halo + body + sheet) used by the side panel and the top pill. */
export function Glass({
  open,
  form,
  orb,
  children,
  footer,
}: {
  open: boolean;
  form: "panel" | "pill";
  orb: OrbState;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const sheet = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const halo = useRef<HTMLDivElement>(null);
  const glass = useRef<SpringGlass | null>(null);
  const kick = useCallback((a: number) => glass.current?.kick(a), []);

  useEffect(() => {
    if (!open || !sheet.current || !body.current || !halo.current) return;
    const g = createSpringGlass(sheet.current, body.current, halo.current, { calm: reduced });
    glass.current = g;
    return () => {
      g.stop();
      glass.current = null;
    };
  }, [open, reduced]);

  return (
    <div className="tv-glass" data-form={form} data-open={open ? "true" : "false"}>
      <div className="tv-halo" ref={halo} />
      <div className="tv-body" ref={body} />
      <div className="tv-sheet" ref={sheet} data-state={orb} data-form={form}>
        <div className="tv-hd">
          <Orb state={orb} size={form === "pill" ? 44 : 48} />
        </div>
        <div className="tv-log">
          <KickContext.Provider value={kick}>{children}</KickContext.Provider>
          {footer}
        </div>
      </div>
    </div>
  );
}

export function ReplayButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="tv-replay" onClick={onClick}>
      {label}
    </button>
  );
}

export function GlassPanel({
  open,
  turns,
  states,
  orb,
  onReplay,
  replayLabel,
  animate = true,
}: {
  open: boolean;
  turns: Turn[];
  states: TurnState[];
  orb: OrbState;
  onReplay?: () => void;
  replayLabel: string;
  /** false paints every word at once (final frames, no-JS render). */
  animate?: boolean;
}) {
  const started = turns.map((_, i) => {
    const s = states[i];
    return !!s && (s.you || s.tool !== "none" || s.jota);
  });
  const activeIdx = started.lastIndexOf(true);
  const lastState = activeIdx >= 0 ? states[activeIdx] : undefined;
  const finished = !!lastState?.jota && activeIdx === turns.length - 1;
  return (
    <Glass
      open={open}
      form="panel"
      orb={orb}
      footer={finished && onReplay ? <ReplayButton label={replayLabel} onClick={onReplay} /> : null}
    >
      {turns.map((t, i) =>
        started[i] ? (
          <TurnView key={i} turn={t} state={states[i]} active={animate && i === activeIdx} compact={i !== activeIdx} />
        ) : null,
      )}
    </Glass>
  );
}
