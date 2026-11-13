import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Idioma } from "./Idioma";

/**
 * Esquina de la portada: «DIY · EN», fija arriba a la derecha sobre la escena. Sin barra: una píldora casi transparente
 * (oscura al 72 % con desenfoque) que da AA incluso sobre blanco puro (6,5:1) y con texto pasando por debajo. Se queda fija todo el recorrido porque es pequeña, queda
 * en la esquina contraria al botón de pausa y es la única forma de llegar al DIY sin bajar hasta «Instálalo».
 */
export async function Esquina() {
  const t = await getTranslations("diy.enlace");
  return (
    <nav
      aria-label={t("label")}
      className="fixed right-3 z-40 flex items-center rounded-full bg-[rgba(11,16,18,0.72)] px-1 text-[14px] uppercase tracking-[0.08em] text-[color:var(--hueso)] backdrop-blur-[6px] [text-shadow:0_1px_6px_rgba(0,0,0,.5)]"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
    >
      <Link href="/diy" className="f-foco inline-flex min-h-11 min-w-11 items-center justify-center px-3 hover:underline">{t("texto")}</Link>
      <span aria-hidden className="text-[color:var(--hueso-suave)]">·</span>
      <Idioma className="inline-flex min-w-11 items-center justify-center px-3 !no-underline hover:!underline" />
    </nav>
  );
}
