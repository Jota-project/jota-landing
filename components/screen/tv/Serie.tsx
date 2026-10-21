"use client";

import { useTranslations } from "next-intl";

/** Series frame (demo .s-video): dusk sea, low sun, title and progress bar. `drive`: a CSS expression for the bar
 *  (0–1) that follows the scroll through custom properties; `progress` is its value when they are not set. */
export function Serie({ playing, progress, drive }: { playing: boolean; progress: number; drive?: string }) {
  const t = useTranslations("screen.tv");
  const p = Math.min(Math.max(progress, 0), 1);
  return (
    <div className="tv-serie" data-testid="tv-serie" data-playing={playing ? "true" : "false"}>
      <i className="sol" aria-hidden="true" />
      <i className="mar" aria-hidden="true" />
      <div className="meta">
        {t("showTitle")} · {t("showMeta")}
      </div>
      <div className="prog">
        <b data-testid="tv-serie-bar" style={{ transform: `scaleX(${drive ?? p})` }} />
      </div>
    </div>
  );
}
