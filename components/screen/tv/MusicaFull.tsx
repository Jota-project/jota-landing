"use client";

import { useTranslations } from "next-intl";

/** Full-screen music (demo .s-musica). `compact` is the variant with the glass panel open. */
export function MusicaFull({ compact }: { compact: boolean }) {
  const t = useTranslations("screen.tv");
  return (
    <div className={`tv-musica${compact ? " compact" : ""}`}>
      <i className="tv-mo a" aria-hidden="true" />
      <i className="tv-mo b" aria-hidden="true" />
      <div className="art" aria-hidden="true" />
      <div className="mcol">
        <div className="ey">
          <span className="eq" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>{t("musicEyebrow")}</span>
        </div>
        <div className="ti">{t("song")}</div>
        <div className="ar">{t("artist")}</div>
        <div className="pr">
          <span>2:14</span>
          <div className="bar">
            <b />
          </div>
          <span>5:37</span>
        </div>
        <div className="nx">{t("upNext")}</div>
        <div className="q">
          <div>
            <i style={{ background: "linear-gradient(135deg,#b08a4a,#4a2a3e)" }} aria-hidden="true" />
            <span>{t("q1Title")}</span>
            <span className="s">{t("artist")}</span>
          </div>
          <div>
            <i style={{ background: "linear-gradient(135deg,#c96a5a,#3b2a6e)" }} aria-hidden="true" />
            <span>{t("q2Title")}</span>
            <span className="s">{t("q2Artist")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
