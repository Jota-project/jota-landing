import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GITHUB_ORG } from "@/lib/github";
import { INSTALL, PROTOCOLO, REPOS } from "@/lib/repos";
import { Copiar } from "@/components/fogar/sitio/Copiar";

/*
 * Lo que sigue al recorrido de la sala, ya sobre la noche: instalar, «Con lo que ya usas», qué sale de casa y qué es
 * abierto, y las cuatro puertas. Un hilo fino a la izquierda une los bloques: la línea que acaba de escribir «Fogar» baja.
 */

const h2 = "font-display text-[clamp(30px,4.2vw,56px)] leading-[1.06] tracking-[-0.035em]";
const lead = "mt-5 max-w-[40ch] text-[clamp(17px,1.6vw,22px)] leading-[1.42] text-[color:var(--hueso-suave)]";

function Bloque({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="f-hilo relative py-[clamp(64px,10vw,140px)]">
      <h2 id={`${id}-t`} className={h2}>{titulo}</h2>
      {children}
    </section>
  );
}

export async function Resto() {
  const t = await getTranslations("home.resto");
  const filas = t.raw("usas.filas") as [string, string][];
  const puertas = t.raw("puertas.items") as [string, string][];
  const destinos = [
    { href: "/diy" as const },
    { href: "/fogar-tv" as const },
    { href: "/diy/como-esta-hecho-fogar" as const },
    { externo: GITHUB_ORG },
  ];
  const piezas = (["gateway", "transcriber", "speaker", "voice"] as const).map((k) => [REPOS[k], t(`casa.piezas.${k}`)] as const);

  return (
    <div className="f-ancho f-hilos">
      <Bloque id="instala" titulo={t("instala.titulo")}>
        <p className={lead}>{t("instala.lead")}</p>
        <div className="mt-8 flex max-w-[980px] flex-col gap-3 rounded-[var(--radio-bloque)] border border-[color:var(--veta)] bg-[color:var(--piedra)] p-3 sm:flex-row sm:items-center sm:gap-4 sm:pl-6">
          <code className="min-w-0 flex-1 whitespace-pre-wrap break-all py-2 font-mono text-[14px] leading-[1.6] text-[color:var(--hueso)]">{INSTALL}</code>
          <Copiar texto={INSTALL} label={t("instala.copiar")} hecho={t("instala.copiado")} className="f-boton-claro shrink-0 self-start sm:self-auto" />
        </div>
        <p className="mt-4 max-w-[62ch] text-[15px] leading-[1.5] text-[color:var(--hueso-suave)]">{t("instala.requisitos")}</p>
        <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[17px]">
          <Link href="/diy" className="f-enlace f-foco inline-flex min-h-11 items-center">{t("instala.diy")}</Link>
          <Link href="/diy/como-esta-hecho-fogar" className="f-enlace f-foco inline-flex min-h-11 items-center">{t("instala.como")}</Link>
        </p>
      </Bloque>

      <Bloque id="con-lo-que-usas" titulo={t("usas.titulo")}>
        <p className={lead}>{t("usas.lead")}</p>
        <dl className="mt-12 grid gap-x-16 border-t border-[color:var(--veta)] md:grid-cols-2">
          {filas.map(([nombre, cuerpo]) => (
            <div key={nombre} className="border-b border-[color:var(--veta)] py-7">
              <dt className="text-[19px] font-semibold">{nombre}</dt>
              <dd className="mt-2 max-w-[48ch] text-[17px] leading-[1.5] text-[color:var(--hueso-suave)]">{cuerpo}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 max-w-[62ch] text-[17px] leading-[1.5] text-[color:var(--hueso-suave)]">
          {t("usas.protocolo")}{" "}<a href={PROTOCOLO} className="f-enlace f-foco text-[color:var(--hueso)]">{t("usas.protocoloLink")}</a>
        </p>
      </Bloque>

      <Bloque id="que-sale-de-casa" titulo={t("casa.titulo")}>
        <p className={lead}>{t("casa.cuerpo")}</p>
        <p className="mt-6 text-[17px]">
          <Link href={{ pathname: "/diy/como-esta-hecho-fogar", hash: "casa" }} className="f-enlace f-foco inline-flex min-h-11 items-center">{t("casa.link")}</Link>
        </p>
        <p className="mt-6 max-w-[62ch] text-[17px] leading-[1.7] text-[color:var(--hueso-suave)]">
          {t("casa.abierto")}{" "}
          {piezas.map(([href, nombre], i) => (
            <span key={href}><a href={href} className="f-enlace f-foco text-[color:var(--hueso)]">{nombre}</a>{i < piezas.length - 1 ? ", " : "."}</span>
          ))}
        </p>
      </Bloque>

      <Bloque id="por-donde-seguir" titulo={t("puertas.titulo")}>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-[var(--radio-bloque)] border border-[color:var(--veta)] bg-[color:var(--veta)] md:grid-cols-2">
          {puertas.map(([titulo, cuerpo], i) => {
            const d = destinos[i], dentro = (
              <>
                <span className="font-display text-[clamp(20px,2vw,26px)] leading-[1.15] tracking-[-0.02em]">{titulo} <span aria-hidden className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1">→</span></span>
                <span className="mt-3 block max-w-[42ch] text-[16px] leading-[1.5] text-[color:var(--hueso-suave)]">{cuerpo}</span>
              </>
            ), clase = "group f-foco block h-full bg-[color:var(--noche)] p-7 transition-colors duration-200 ease-out hover:bg-[color:var(--piedra)] md:p-9";
            return <li key={titulo}>{"href" in d ? <Link href={d.href!} className={clase}>{dentro}</Link> : <a href={d.externo} className={clase}>{dentro}</a>}</li>;
          })}
        </ul>
      </Bloque>
    </div>
  );
}
