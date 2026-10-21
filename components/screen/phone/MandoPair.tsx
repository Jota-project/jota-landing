"use client";

import { useTranslations } from "next-intl";

/** The remote's pairing view (index.html #pairV): the 4-digit field fills as the code arrives, then «Emparejado». */
export function MandoPair({ digits, code, paired }: { digits: number; code: string; paired: boolean }) {
  const t = useTranslations("screen");
  return (
    <div className="mp" data-paired={paired ? "true" : "false"}>
      <div className="mp-pc">
        <svg className="mp-lg" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="12" rx="2.5" />
          <path d="M9 20.5h6M12 17v3.5" />
        </svg>
        <h2 className="mp-h">{t("remote.room")}</h2>
        <p className="mp-p">{t("tv.pairTitle")}</p>
        <div className="mp-code">
          {code.split("").map((d, i) => (
            <span key={i} className="mp-d" data-slot={i} data-on={i < digits ? "true" : "false"}>
              {i < digits ? d : "·"}
            </span>
          ))}
        </div>
        <p className="mp-ok" data-on={paired ? "true" : "false"}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          {paired && <span>{t("s5.paired")}</span>}
        </p>
      </div>
    </div>
  );
}
