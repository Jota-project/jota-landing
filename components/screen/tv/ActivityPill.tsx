const CIRC = 138.2;

/** Live-activity pill. progress 0–1 = how much of the ring is still drawn (1 = full). */
export function ActivityPill({
  on,
  label,
  time,
  progress,
  shifted = false,
  hidden = false,
}: {
  on: boolean;
  label: string;
  time: string;
  progress: number;
  shifted?: boolean;
  hidden?: boolean;
}) {
  const p = Math.min(1, Math.max(0, progress));
  return (
    <div
      className="tv-act"
      data-on={on ? "true" : "false"}
      data-shifted={shifted ? "true" : "false"}
      data-hidden={hidden ? "true" : "false"}
    >
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(246,243,240,.14)" strokeWidth="4" />
        <circle
          className="r"
          cx="26"
          cy="26"
          r="22"
          fill="none"
          stroke="currentColor"
          style={{ color: "var(--dacc)", strokeDashoffset: (CIRC * (1 - p)).toFixed(1) }}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          transform="rotate(-90 26 26)"
        />
      </svg>
      <span className="k">{label}</span>
      <span className="n">{time}</span>
    </div>
  );
}
