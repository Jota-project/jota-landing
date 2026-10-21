import type { CSSProperties } from "react";

/** Jota's orb on the TV (the demo's .orbe). Not the landing's components/Orb.tsx. */
export function Orb({
  state,
  size = 48,
}: {
  state: "idle" | "listen" | "think" | "talk";
  size?: number;
}) {
  return (
    <div
      className="orbe"
      data-state={state}
      style={{ "--sz": `${size}px` } as CSSProperties}
    >
      <i />
    </div>
  );
}
