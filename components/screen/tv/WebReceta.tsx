"use client";

import { useTranslations } from "next-intl";

/** Recipe website (demo .s-web) with its loading bar. */
export function WebReceta({ loading }: { loading: boolean }) {
  const t = useTranslations("screen.tv");
  return (
    <div className="tv-web" data-testid="tv-web" data-loading={loading ? "true" : "false"}>
      <div className="ld" />
      <div className="bar">
        <span className="site">{t("recipeName")}</span>
        <span>{t("recipeNav1")}</span>
        <span>{t("recipeNav2")}</span>
        <span>{t("recipeNav3")}</span>
        <span className="url">{t("recipeSite")}</span>
      </div>
      <h2>{t("recipeTitle")}</h2>
      <div className="sk">
        <b />
        <b style={{ width: "92%" }} />
        <b style={{ width: "78%" }} />
      </div>
      <div className="gal" aria-hidden="true">
        <i style={{ background: "#d98a3c" }} />
        <i style={{ background: "#8fae8b" }} />
        <i style={{ background: "#e8b86c" }} />
      </div>
    </div>
  );
}
