"use client";

import { useTranslations } from "next-intl";

/** Pairing code shown on the TV; digits appear one by one. */
export function PairCode({ code, visibleDigits }: { code: string; visibleDigits: number }) {
  const t = useTranslations("screen.tv");
  return (
    <div className="tv-pair">
      <p className="pt">{t("pairTitle")}</p>
      <div className="pd">
        {code.split("").map((d, i) => (
          <span key={i} className="d" data-testid="tv-digit" data-on={i < visibleDigits ? "true" : "false"}>
            {d}
          </span>
        ))}
      </div>
      <p className="ph">{t("pairHint")}</p>
    </div>
  );
}
