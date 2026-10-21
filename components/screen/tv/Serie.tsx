"use client";

import { useTranslations } from "next-intl";

/** Series frame (demo .s-video): dusk sea, low sun, title and progress bar. */
export function Serie({ playing, progress }: { playing: boolean; progress: number }) {
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
        <b style={{ transform: `scaleX(${p})` }} />
      </div>
    </div>
  );
}
