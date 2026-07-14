export function ArchitectureDiagram({
  variant = "hero",
}: {
  variant?: "hero" | "engineering";
}) {
  const isHero = variant === "hero";

  return (
    <svg
      viewBox="0 0 400 240"
      role="img"
      aria-label="Voice to action diagram"
      className="w-full h-auto max-w-[420px]"
    >
      <defs>
        <linearGradient id="connector" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7C6AAE" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6E8CC4" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="orb-grad" cx="32%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#A99AD1" />
          <stop offset="46%" stopColor="#7C6AAE" />
          <stop offset="100%" stopColor="#6E8CC4" />
        </radialGradient>
      </defs>

      {/* Connectors */}
      <path
        d="M 60 120 C 130 120, 150 60, 200 60"
        fill="none"
        stroke="url(#connector)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 200 180 C 270 180, 290 120, 340 120"
        fill="none"
        stroke="url(#connector)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Voice node (left) */}
      <g>
        <circle cx="60" cy="120" r="36" fill="#F6F3F0" stroke="#DED6CF" />
        <path
          d="M 50 110 q 10 -10 20 0 v 14 q -10 10 -20 0 z M 56 130 v 8 M 64 130 v 8"
          fill="none"
          stroke="#2A2433"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      {/* Jota node (center, orb) */}
      <g>
        <circle cx="200" cy="120" r="48" fill="url(#orb-grad)" />
      </g>

      {/* Home node (right) */}
      <g>
        <circle cx="340" cy="120" r="36" fill="#F6F3F0" stroke="#DED6CF" />
        <path
          d="M 320 128 L 340 110 L 360 128 V 142 H 320 Z M 332 142 V 132 H 348 V 142"
          fill="none"
          stroke="#2A2433"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>

      {/* Labels */}
      {!isHero && (
        <g
          fill="#6A6377"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          textAnchor="middle"
        >
          <text x="60" y="190">Voice</text>
          <text x="200" y="200">Jota</text>
          <text x="340" y="190">Home</text>
        </g>
      )}
    </svg>
  );
}
