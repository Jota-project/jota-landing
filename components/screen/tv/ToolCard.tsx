const ICONS = {
  where: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
} as const;

export function ToolCard({
  icon,
  title,
  sub,
  state,
  compact = false,
}: {
  icon: keyof typeof ICONS;
  title: string;
  sub?: string;
  state: "run" | "done";
  compact?: boolean;
}) {
  return (
    <div className="tv-tc" data-state={state} data-compact={compact ? "true" : "false"}>
      <div className="ic">
        <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: ICONS[icon] }} />
      </div>
      <div>
        <div className="tt">{title}</div>
        {sub && <div className="tb">{sub}</div>}
      </div>
      <div className="ss">
        {state === "done" ? (
          <svg viewBox="0 0 24 24" data-testid="tool-check">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : (
          <div className="tv-spin ss" data-testid="tool-spin" />
        )}
      </div>
    </div>
  );
}
