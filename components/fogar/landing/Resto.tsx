import type { CSSProperties, ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GITHUB_ORG } from "@/lib/github";
import { INSTALL, PROTOCOLO, REPOS } from "@/lib/repos";
import { Casa } from "@/components/fogar/diy/Casa";
import { diyIndice } from "@/content/fogar/diy";
import { esNueva } from "@/content/fogar/diy/nuevo";
import { Terminal } from "./Terminal";
import { Vigia } from "./Vigia";
import "./portada.css";

/*
 * Lo que sigue al recorrido de la sala, ya sobre la noche: instalar, lo último del DIY, el mapa de lo que ya usas, qué sale de casa y las
 * cuatro puertas. El hilo de la izquierda baja con el scroll y enciende el punto de cada bloque al llegar (Vigia).
 * Los fondos alternan noche y piedra; las piezas entran con `.p-entra` y su `--i`.
 */

const h2 = "p-titulo font-display text-[clamp(32px,4.6vw,64px)] leading-[1.04] tracking-[-0.035em] text-balance";
// En media columna (5/12) el h2 grande parte en cinco líneas en inglés.
const h2Medio = h2.replace("text-[clamp(32px,4.6vw,64px)]", "text-[clamp(32px,3.6vw,52px)]");
const lead = "max-w-[40ch] text-[clamp(17px,1.6vw,22px)] leading-[1.42] text-[color:var(--hueso-suave)]";
const i = (n: number) => ({ "--i": n }) as CSSProperties;

function Bloque({ id, titulo, piedra = false, cabeza, children }: { id: string; titulo: string; piedra?: boolean; cabeza?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} data-bloque className={piedra ? "bg-[color:var(--piedra)]" : undefined}>
      <div className="p-hilo py-[clamp(72px,11vw,160px)]">
        {cabeza ?? <h2 id={`${id}-t`} className={`${h2} p-entra`}>{titulo}</h2>}
        {children}
      </div>
    </section>
  );
}

type Nodo = [string, string, "hoy" | "desarrollo" | "tuyo"];

/** El ecosistema: los clientes a un lado, lo que hay detrás al otro y el gateway en medio. Listas reales; los cables son decorado. */
async function Mapa() {
  const t = await getTranslations("home.resto.mapa");
  const estados = t.raw("estados") as Record<Nodo[2], string>;
  const [centro, centroSub] = t.raw("centro") as [string, string];
  const lista = (nodos: Nodo[], base: number) => nodos.map(([n, d, e], k) => (
    <li key={n} className="p-nodo p-entra" data-estado={e} style={i(base + k)}>
      <span className="p-caja">
        <span className="p-n">{n}</span>
        <span className="p-d">{d}</span>
        {e === "hoy" ? <span className="sr-only">{estados.hoy}</span> : <span className="p-tag">{estados[e]}</span>}
      </span>
      <span className="p-cable" aria-hidden />
    </li>
  ));
  return (
    <figure data-grupo className="p-mapa mt-14 md:mt-20" aria-label={t("label")}>
      <p className="p-mapa-et p-entra" style={{ gridArea: "et1", ...i(0) }}>{t("clientes")}</p>
      <ul className="p-col p-izq" style={{ gridArea: "l1" }}>{lista(t.raw("nodosClientes") as Nodo[], 1)}</ul>
      <p className="p-centro p-entra" style={{ gridArea: "c", ...i(4) }}>
        <span className="p-gw"><span className="p-n">{centro}</span><span className="p-d">{centroSub}</span></span>
      </p>
      <p className="p-mapa-et p-et2 p-entra" style={{ gridArea: "et2", ...i(5) }}>{t("detras")}</p>
      <ul className="p-col p-der" style={{ gridArea: "l2" }}>{lista(t.raw("nodosDetras") as Nodo[], 6)}</ul>
      <figcaption className="p-leyenda p-entra" style={i(10)}>
        <span className="max-w-[52ch]">{t("abierto")}</span>
        <span className="p-claves" aria-hidden>
          {(["hoy", "desarrollo", "tuyo"] as const).map((e) => <span key={e} data-estado={e}>{estados[e]}</span>)}
        </span>
      </figcaption>
    </figure>
  );
}

export async function Resto() {
  const t = await getTranslations("home.resto");
  const tRaiz = await getTranslations();
  const tDiy = await getTranslations("diy");
  const entradas = diyIndice(await getLocale()).entradas.slice(0, 3); // ya vienen de la más nueva a la más antigua
  const filas = t.raw("usas.filas") as [string, string][];
  const puertas = t.raw("puertas.items") as [string, string][];
  const piezas = (["gateway", "transcriber", "speaker", "voice"] as const).map((k) => [REPOS[k], t(`casa.piezas.${k}`)] as const);
  const flecha = <span aria-hidden className="p-flecha">→</span>;

  return (
    <div data-resto className="p-resto">
      <Vigia />

      <Bloque id="instala" titulo={t("instala.titulo")} cabeza={<></>}>
        <div className="grid gap-12 md:grid-cols-12 md:items-center md:gap-10">
          <div className="md:col-span-5">
            <h2 id="instala-t" tabIndex={-1} className={`${h2} p-entra`}>{t("instala.titulo")}</h2>
            <p className={`${lead} mt-5 p-entra`} style={i(1)}>{t("instala.lead")}</p>
            <p className="mt-6 max-w-[44ch] text-[15px] leading-[1.55] text-[color:var(--hueso-suave)] p-entra" style={i(2)}>{t("instala.requisitos")}</p>
            <p className="mt-6 flex flex-wrap gap-x-8 gap-y-1 text-[17px] p-entra" style={i(3)}>
              <Link href="/diy" className="f-enlace f-foco inline-flex min-h-11 items-center">{t("instala.diy")}</Link>
              <Link href="/diy/como-esta-hecho-fogar" className="f-enlace f-foco inline-flex min-h-11 items-center">{t("instala.como")}</Link>
            </p>
          </div>
          <div className="md:col-span-7 p-entra" style={i(2)}>
            <Terminal texto={INSTALL} label={t("instala.copiar")} hecho={t("instala.copiado")} rotulo={t("instala.terminal")} lineaLabel={tRaiz("home.d.lineaLabel")} />
          </div>
        </div>
      </Bloque>

      <Bloque id="del-diy" titulo={tDiy("portada.titulo")} piedra cabeza={
        <div className="grid gap-5 md:grid-cols-2 md:items-end md:gap-12">
          <h2 id="del-diy-t" className={`${h2} p-entra`}>{tDiy("portada.titulo")}</h2>
          <p className={`${lead} p-entra md:pb-2`} style={i(1)}>{tDiy("portada.lead")}</p>
        </div>
      }>
        <ul data-grupo className="p-diy mt-12 md:mt-16">
          {entradas.map((e, k) => (
            <li key={e.slug} className="p-entra" style={i(k)}>
              <Link href={`/diy/${e.slug}`} className="p-puerta">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[color:var(--hueso-suave)]">
                  {esNueva(e.iso) && <span className="p-nuevo">{tDiy("nuevo")}</span>}
                  <span>{e.tipo}</span><span aria-hidden>·</span><time dateTime={e.iso}>{e.fecha}</time>
                </span>
                <span className="p-puerta-t mt-3 block">{e.titulo}</span>
                <span className="p-puerta-d">{e.resumen}</span>
                <span className="mt-5 inline-flex items-center gap-2 text-[15px]">{tDiy("portada.leer")} {flecha}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[17px] p-entra" style={i(entradas.length)}>
          <Link href="/diy" className="f-enlace f-foco inline-flex min-h-11 items-center gap-2">{tDiy("portada.todo")} {flecha}</Link>
        </p>
      </Bloque>

      <Bloque id="con-lo-que-usas" titulo={t("usas.titulo")} cabeza={
        <div className="grid gap-5 md:grid-cols-2 md:items-end md:gap-12">
          <h2 id="con-lo-que-usas-t" className={`${h2} p-entra`}>{t("usas.titulo")}</h2>
          <p className={`${lead} p-entra md:pb-2`} style={i(1)}>{t("usas.lead")}</p>
        </div>
      }>
        <Mapa />
        <dl data-grupo className="mt-16 border-b border-[color:var(--veta)] md:mt-24">
          {filas.map(([nombre, cuerpo], k) => (
            <div key={nombre} className="grid gap-2 border-t border-[color:var(--veta)] py-7 md:grid-cols-[18rem_1fr] md:gap-10 md:py-9 p-entra" style={i(k)}>
              <dt className="font-display text-[clamp(22px,2.3vw,30px)] leading-[1.15] tracking-[-0.03em]">{nombre}</dt>
              <dd className="max-w-[56ch] text-[17px] leading-[1.55] text-[color:var(--hueso-suave)] md:pt-1">{cuerpo}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 max-w-[62ch] text-[17px] leading-[1.5] text-[color:var(--hueso-suave)] p-entra" style={i(4)}>
          {t("usas.protocolo")}{" "}<a href={PROTOCOLO} className="f-enlace f-foco text-[color:var(--hueso)]">{t("usas.protocoloLink")}</a>
        </p>
      </Bloque>

      <Bloque id="que-sale-de-casa" titulo={t("casa.titulo")} piedra cabeza={<></>}>
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5 md:sticky md:top-12 md:self-start">
            <h2 id="que-sale-de-casa-t" className={`${h2Medio} p-entra`}>{t("casa.titulo")}</h2>
            <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-[color:var(--hueso-suave)] p-entra" style={i(1)}>{t("casa.cuerpo")}</p>
            <p className="mt-5 text-[17px] p-entra" style={i(2)}>
              <Link href={{ pathname: "/diy/como-esta-hecho-fogar", hash: "casa" }} className="f-enlace f-foco inline-flex min-h-11 items-center">{t("casa.link")}</Link>
            </p>
          </div>
          <div className="md:col-span-7 p-entra" style={i(2)}>
            <div className="p-casa"><Casa /></div>
            <p className="mt-2 text-[15px] text-[color:var(--hueso-suave)]">{t("casa.abierto")}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {piezas.map(([href, nombre]) => (
                <li key={href}><a href={href} className="p-chip">{nombre} <span aria-hidden>↗</span></a></li>
              ))}
            </ul>
          </div>
        </div>
      </Bloque>

      <Bloque id="por-donde-seguir" titulo={t("puertas.titulo")}>
        <ul className="p-puertas mt-12 md:mt-16">
          <li className="p-entra md:col-span-7" style={i(1)}>
            <Link href="/diy" className="p-puerta p-puerta-llena">
              <span className="font-display text-[clamp(30px,3.8vw,52px)] leading-[1.04] tracking-[-0.035em]">{puertas[0][0]} {flecha}</span>
              <span className="p-llena-d mt-4 block max-w-[34ch] text-[17px] leading-[1.5]">{puertas[0][1]}</span>
            </Link>
          </li>
          <li className="p-entra md:col-span-5" style={i(2)}>
            <Link href="/fogar-tv" className="p-puerta">
              <span className="p-mini" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element -- el mismo fotograma de la escena, ya en caché */}
                <img src="/lab/secuencia/v6/1280/f_000.avif" alt="" loading="lazy" decoding="async" />
                <span className="p-mini-pantalla">
                  <span className="p-mini-marca">Fogar</span>
                  <span>{tRaiz("tele.tiempo")}</span>
                  <span className="p-mini-tempo">{tRaiz("tele.tempo")} · {tRaiz("tele.tempoSub")}</span>
                </span>
              </span>
              <span className="p-puerta-t">{puertas[1][0]} {flecha}</span>
              <span className="p-puerta-d">{puertas[1][1]}</span>
            </Link>
          </li>
          <li className="p-entra md:col-span-6" style={i(3)}>
            <Link href="/diy/como-esta-hecho-fogar" className="p-puerta">
              <span className="p-puerta-t">{puertas[2][0]} {flecha}</span>
              <span className="p-puerta-d">{puertas[2][1]}</span>
            </Link>
          </li>
          <li className="p-entra md:col-span-6" style={i(4)}>
            <a href={GITHUB_ORG} className="p-puerta">
              <span className="p-puerta-t">{puertas[3][0]} <span aria-hidden className="p-flecha">↗</span></span>
              <span className="p-puerta-d">{puertas[3][1]}</span>
            </a>
          </li>
        </ul>
      </Bloque>
    </div>
  );
}
