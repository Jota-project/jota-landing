"use client";

export type GrowPhase = "hidden" | "small" | "full" | "gone";

/** A tile that grows from its place on the home screen to full screen (demo AbrirApp). */
export function GrowTile({
  phase,
  title,
  sub,
  from,
}: {
  phase: GrowPhase;
  title: string;
  sub: string;
  from: { x: number; y: number; scale: number };
}) {
  const full = phase === "full" || phase === "gone";
  return (
    <div
      className="tv-grow"
      data-testid="tv-grow"
      data-phase={phase}
      style={{
        transform: full ? "none" : `translate(${from.x}px,${from.y}px) scale(${from.scale})`,
        borderRadius: full ? 0 : 116,
        opacity: phase === "small" || phase === "full" ? 1 : 0,
      }}
    >
      <div className="nm">
        <b>{title}</b>
        <span>{sub}</span>
      </div>
    </div>
  );
}
