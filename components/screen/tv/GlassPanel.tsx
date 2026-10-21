"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "../hooks";
import { Orb } from "./Orb";
import { ToolCard } from "./ToolCard";
import { Words } from "./Words";
import { createSpringGlass } from "./glass";

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
  active: boolean;
  compact: boolean;
}) {
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
          <Words text={turn.jota} play={active} />
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

  useEffect(() => {
    if (!open || !sheet.current || !body.current || !halo.current) return;
    const g = createSpringGlass(sheet.current, body.current, halo.current, { calm: reduced });
    return () => g.stop();
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
          {children}
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
}: {
  open: boolean;
  turns: Turn[];
  states: TurnState[];
  orb: OrbState;
  onReplay?: () => void;
  replayLabel: string;
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
          <TurnView key={i} turn={t} state={states[i]} active={i === activeIdx} compact={i !== activeIdx} />
        ) : null,
      )}
    </Glass>
  );
}
