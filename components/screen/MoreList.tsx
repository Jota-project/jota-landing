import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

const props = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

/** One stroke icon per item of s7.items, bound by the item's `icon` id (not by position). */
const ICONS: Record<string, ReactNode> = {
  // Escenario: a slide over a page
  stage: (
    <svg {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  ),
  // Spotify Connect: speaker
  spotify: (
    <svg {...props}>
      <rect x="6" y="3" width="12" height="18" rx="3" />
      <circle cx="12" cy="14" r="3" />
      <path d="M12 7h.01" />
    </svg>
  ),
  // Reposo: day to night
  reposo: (
    <svg {...props}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
      <path d="M17 3v4M15 5h4" />
    </svg>
  ),
  // Otros agentes: connected nodes
  agents: (
    <svg {...props}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      <circle cx="10" cy="18" r="2.5" />
      <path d="M8.3 7l7.4 .7M7.2 8.2l2 7.3M16.6 10.2L11.6 16" />
    </svg>
  ),
  // Jota Cloud o Local: cloud
  cloud: (
    <svg {...props}>
      <path d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 8.5 4.8 4.8 0 0 1 17 18H7Z" />
    </svg>
  ),
};

/** Scene 7 · more things it already does: a 2–3 column grid with stroke icons. */
export function MoreList() {
  const t = useTranslations("screen");
  const items = t.raw("s7.items") as {
    title: string;
    body: string;
    icon: string;
  }[];
  return (
    <section id="s7" data-scene="7" className="more">
      <h2 className="more-title">{t("s7.title")}</h2>
      <ul className="more-grid">
        {items.map((item) => (
          <li key={item.title} className="more-item">
            <span className="more-ic">{ICONS[item.icon]}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
