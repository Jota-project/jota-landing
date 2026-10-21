"use client";

import { useTranslations } from "next-intl";

const GRAD: [string, string][] = [
  ["#3d5486", "#7c6aae"],
  ["#a0603f", "#5e3f6e"],
  ["#2f5f6e", "#3b2a6e"],
  ["#4f6a3a", "#2c3a5a"],
];
const PROGRESS = [0.62, 0.39, 0.44, 0.18];
const SERVICE = ["Netflix", "YouTube", "Netflix", "YouTube"];
const YT: [string, string][] = [
  ["#8a5a3a", "#3b2a4e"],
  ["#1f2f5a", "#5e4c92"],
  ["#6e4a5a", "#2a3a4e"],
];
const APPS = [
  { n: "Netflix", l: "N", c: "#5a2730" },
  { n: "YouTube", l: "Y", c: "#5a3030" },
  { n: "Spotify", l: "S", c: "#2a4a3a" },
  { n: "Web", l: "W", c: "#3a3550" },
];

/** Home screen: top bar, hero of the focused item, «Seguir viendo», YouTube row and apps. */
export function Inicio({ focus = 0 }: { focus?: number }) {
  const t = useTranslations("screen.tv");
  const items = [
    { title: t("showTitle"), meta: t("showMeta") },
    { title: t("i1Title"), meta: t("i1Meta") },
    { title: t("i2Title"), meta: t("i2Meta") },
    { title: t("i3Title"), meta: t("i3Meta") },
  ];
  const f = Math.min(Math.max(Math.round(focus), 0), items.length - 1);
  const [a, b] = GRAD[f];

  return (
    <div className="tv-inicio" style={{ ["--ca" as string]: a, ["--cb" as string]: b }}>
      <i className="tv-ini-orb a" aria-hidden="true" />
      <i className="tv-ini-orb b" aria-hidden="true" />

      <div className="tv-ini-top">
        <span className="tv-ini-clock">21:40</span>
        <span className="tv-ini-wx">
          {t("weather")}, {t("weatherDetail").toLowerCase()}
        </span>
        <div className="tv-ini-hint">
          <i className="tv-ini-dot" aria-hidden="true" />
          <span>{t("hint")}</span>
        </div>
      </div>

      <div className="tv-ini-hero" key={f}>
        <div className="sv">{SERVICE[f]}</div>
        <div className="ti">{items[f].title}</div>
        <div className="me">{items[f].meta}</div>
      </div>

      <div className="tv-ini-lbl" style={{ left: 96, top: 520 }}>
        {t("continueWatching")}
      </div>
      <div className="tv-ini-row">
        {items.map((it, i) => (
          <div className="tv-ini-card" key={i}>
            <div
              className="tv-tile"
              data-testid={`tv-tile-${i}`}
              data-focus={i === f ? "true" : "false"}
              style={{ background: `linear-gradient(135deg,${GRAD[i][0]},${GRAD[i][1]})` }}
            >
              {it.title.length <= 16 && <span>{it.title}</span>}
            </div>
            <div className="tv-ini-prog">
              <b style={{ transform: `scaleX(${PROGRESS[i]})` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="tv-ini-lbl" style={{ left: 96, top: 800 }}>
        {t("forYou")}
      </div>
      <div className="tv-ini-yt">
        {[t("y1"), t("y2"), t("y3")].map((title, i) => (
          <div className="y" key={i}>
            <div className="th" style={{ background: `linear-gradient(135deg,${YT[i][0]},${YT[i][1]})` }} />
            <div className="tt">{title}</div>
          </div>
        ))}
      </div>

      <div className="tv-ini-lbl" style={{ right: 96, top: 800 }}>
        {t("apps")}
      </div>
      <div className="tv-ini-apps">
        {APPS.map((ap) => (
          <div className="ap" key={ap.n}>
            <div className="ic" style={{ background: ap.c }} aria-hidden="true">
              {ap.l}
            </div>
            <div className="nm">{ap.n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
