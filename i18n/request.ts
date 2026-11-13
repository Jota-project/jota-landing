import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Un archivo de mensajes por página además del común, para que cada página se edite sin pisar a las demás.
const PAGINAS = ["diy", "tv"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const comun = (await import(`../messages/${locale}.json`)).default;
  const paginas = await Promise.all(PAGINAS.map((p) => import(`../messages/${p}.${locale}.json`).then((m) => m.default)));
  return { locale, messages: Object.assign({}, comun, ...paginas) };
});
