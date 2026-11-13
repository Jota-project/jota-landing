"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import ScrollSequence from "@/components/fogar/ScrollSequence";
import { Anclado, letra } from "@/components/fogar/escena/Escena";
import { useTranslations } from "next-intl";
import { LineaViva } from "@/components/fogar/linea-viva/LineaViva";
import { Link } from "@/i18n/navigation";
import { GITHUB_ORG } from "@/lib/github";
import { PROTOCOLO } from "@/lib/repos";
import { pinta, ponExtra, type Bus } from "../bus";
import { ALTO_VH, ANCLA, FIJA, N, estacionDe, fotogramaDe, pasoBalda, type Estacion } from "./guion";
import type { TextosTele } from "./tele";

/*
 * Dirección D · Hilo. Fogar es una línea de luz que recorre la casa: la línea viva vive en la sala (WebGL), ilumina la
 * piedra y el yeso que tiene cerca y el ratón juega con ella; la tele está encendida con Fogar TV de verdad. Encima, poco
 * texto, grande y anclado a la escena. Ningún objeto lleva rótulo salvo cuando la parada habla de él (la balda).
 * Las cinco estaciones están siempre en el DOM (lectores de pantalla y Tab llegan a todas); solo cambia su opacidad.
 * Móvil, puntero táctil y «reducir movimiento»: modo fijo, una imagen por estación y el texto debajo, sin WebGL.
 */

const FIJO = "(prefers-reduced-motion: reduce), (max-width: 767px), (pointer: coarse)";
const foco = "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[color:var(--hueso)] focus-visible:shadow-[0_0_0_7px_var(--noche)]";
const h2 = "font-display leading-[1.06] tracking-[-0.035em] text-[color:var(--hueso)]";
const cuerpo = "text-[color:var(--hueso)]";
const img = (f: number, ancho = 1280) => `/lab/secuencia/v6/${ancho}/f_${String(f).padStart(3, "0")}.avif`;
const TEMPERATURA = 21;
/** Encuadre de cada foto en el recorte 4:5 del móvil (en 16:9 no se nota): la portada va centrada porque la tele fija cuenta con ello. */
const ENCUADRE = { portada: "50% 50%", gateway: "22% 50%", voz: "50% 50%", balda: "30% 50%", pared: "50% 50%" } as const;
export const TINTA = { paleta: { ascua: "#9c8f7b", llama: "#e6d9c2", chispa: "#fffaf0", contra: "#cfe6d6", hueso: "#ece6dc" }, halo: 1.6, humo: "#e9e0d0" };

const CSS = `
.d-capa{position:absolute;inset:0;--s:max(100cqw / 1920,100cqh / 1080);pointer-events:none;opacity:0;transition:opacity .25s ease-out}
.d-capa *{pointer-events:none}
.d-capa.on{opacity:1}
.d-capa.on a,.d-capa.on button,.d-capa.on .d-zona{pointer-events:auto}
.d-e{opacity:0;transform:translateY(6px);transition:opacity .2s ease-out,transform .2s ease-out}
.on .d-e,.d-e.ya{opacity:1;transform:none;transition:opacity .5s cubic-bezier(.23,1,.32,1),transform .5s cubic-bezier(.23,1,.32,1);transition-delay:calc(var(--i,0) * 60ms + 120ms)}
.d-obj{opacity:0;transform:translateY(6px);transition:opacity .16s ease-out,transform .16s ease-out}
.d-obj.ya{opacity:1;transform:none;transition-duration:.5s;transition-timing-function:cubic-bezier(.23,1,.32,1)}
.d-fijo .d-e,.d-fijo .d-obj{opacity:1;transform:none}
.d-guia{position:absolute;width:1px;background:var(--hueso);opacity:.3}
.d-boton{transition:background-color .2s ease-out,color .2s ease-out,border-color .2s ease-out,transform .12s ease-out}
.d-boton:active{transform:scale(.97)}
.d-luz{transition:opacity .3s cubic-bezier(.23,1,.32,1)}
.d-luz.on{transition-duration:.12s}
`;

function modoDe() { return new URLSearchParams(location.search).has("fijo") || matchMedia(FIJO).matches ? "fijo" : "escena"; }

/** Fogar TV quieta sobre la pantalla de la foto, para el modo fijo. */
function TeleFija({ textos }: { textos: TextosTele }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let vivo = true;
    import("./tele").then(({ crearTele }) => {
      if (!vivo || !ref.current) return;
      const t = crearTele({ ancho: 960, reduce: true, textos });
      t.lienzo.className = "block h-full w-full";
      ref.current.append(t.lienzo);
      t.paso(0, 0);
      t.listo.then(() => vivo && t.paso(0, 0));
    });
    return () => { vivo = false; };
  }, [textos]);
  // La pantalla de la tele en f_000: 693–1226 × 270–570 de 1920 × 1080.
  // En 4:5 (móvil) se ve el centro de la foto, 864 de sus 1920 px: la pantalla queda en 19,1 % + 61,7 % del ancho.
  return <div ref={ref} aria-hidden className="absolute left-[19.1%] top-[25%] h-[27.78%] w-[61.7%] md:left-[36.1%] md:w-[27.76%]" />;
}

type Ctx = { fijo: boolean; estacion: Estacion | null; bus: Bus; irA: (e: Estacion) => void };
const DCtx = createContext<Ctx | null>(null);

/** Una estación: en la escena, una capa a pantalla completa que solo cambia de opacidad; en el modo fijo, su contenido. */
function Capa({ e, children }: { e: Estacion; children: ReactNode }) {
  const { fijo, estacion, bus, irA } = useContext(DCtx)!;
  if (fijo) return <>{children}</>;
  return (
    <section id={`d-${e}`} aria-labelledby={`d-t-${e}`} className={`d-capa ${estacion === e ? "on" : ""}`} onFocus={() => { if (bus.estacion !== e) irA(e); }}>
      {children}
    </section>
  );
}
/** En la escena, anclado a coordenadas del fotograma; en el modo fijo, un bloque normal. */
function En({ x, y, w, i = 0, entra = true, className = "", children }: { x: number; y: number; w?: number; i?: number; entra?: boolean; className?: string; children: ReactNode }) {
  const { fijo } = useContext(DCtx)!;
  if (fijo) return <div className={className}>{children}</div>;
  return <Anclado x={x} y={y} w={w} className={`!pointer-events-none ${entra ? "d-e" : ""} ${className}`}><div style={{ "--i": i } as CSSProperties}>{children}</div></Anclado>;
}

export function DireccionD() {
  const t = useTranslations("home.d");
  const tRaiz = useTranslations();
  const [textosTele] = useState(() => tRaiz.raw("tele") as TextosTele);
  const NAV: [Exclude<Estacion, "cierre">, string][] = [["portada", t("navPortada")], ["gateway", t.raw("gatewayH2").join(" ")], ["voz", t.raw("vozH2").join(" ")], ["balda", t.raw("baldaH2").join(" ")], ["pared", t("paredH2")]];
  const [bus] = useState<Bus>(() => ({ frame: 0, canvas: null, dirty: false, mouse: [0.5, 0.5], estacion: "portada", v: 0 }));
  const [modo, setModo] = useState<"escena" | "fijo" | null>(null);
  const [ancho, setAncho] = useState(1280);
  const [estacion, setEstacion] = useState<Estacion | null>("portada");
  const [paso, setPaso] = useState(0);
  const [lampara, setLampara] = useState(false);
  const [pausa, setPausa] = useState(false);
  const [gl, setGl] = useState(false);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const tramo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = matchMedia(FIJO), pon = () => setModo(modoDe());
    pon();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el ancho depende de la pantalla: solo se sabe en el navegador
    setAncho(innerWidth * Math.min(devicePixelRatio, 2) > 1600 ? 1920 : 1280);
    mq.addEventListener("change", pon);
    try { if (localStorage.getItem("fogar-pausa") === "1") setPausa(true); } catch { /* sin almacenamiento, la pausa no se recuerda */ }
    const mueve = (e: PointerEvent) => { bus.mouse = [e.clientX / innerWidth, e.clientY / innerHeight]; };
    const scroll = () => {
      const el = tramo.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      bus.v = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight))) * ALTO_VH;
      setPaso(pasoBalda(bus.v));
    };
    addEventListener("pointermove", mueve, { passive: true });
    addEventListener("scroll", scroll, { passive: true });
    (window as unknown as { __fogar: unknown }).__fogar = { bus, irA };
    return () => { mq.removeEventListener("change", pon); removeEventListener("pointermove", mueve); removeEventListener("scroll", scroll); };
  }, [bus]);

  useEffect(() => { ponExtra(bus, "lampara", lampara ? 1 : 0); }, [bus, lampara]);
  useEffect(() => { ponExtra(bus, "pausa", pausa ? 1 : 0); try { localStorage.setItem("fogar-pausa", pausa ? "1" : "0"); } catch { /* igual */ } }, [bus, pausa]);

  // La capa WebGL: después de `load` y en un hueco ocioso, y solo en el modo escena. El HTML llega primero.
  useEffect(() => {
    if (modo !== "escena" || !lienzo.current) return;
    let quitar: (() => void) | undefined, vivo = true;
    const arranca = () => import("./gl").then(
      (m) => { if (vivo && lienzo.current) { quitar = m.default(lienzo.current, bus, textosTele); setGl(true); } },
      (e) => console.warn("Sin capa WebGL:", e),
    );
    const ocioso = () => ("requestIdleCallback" in window ? requestIdleCallback(arranca, { timeout: 1200 }) : setTimeout(arranca, 200));
    if (document.readyState === "complete") ocioso(); else addEventListener("load", ocioso, { once: true });
    return () => { vivo = false; quitar?.(); setGl(false); };
  }, [modo, bus, textosTele]);

  const src = useMemo(() => (i: number) => img(i, ancho), [ancho]);
  const onPaint = useMemo(() => (i: number, canvas: HTMLCanvasElement) => { const e = estacionDe(i); if (pinta(bus, i, canvas, e)) setEstacion(e); }, [bus]);

  /** Lleva el scroll a la parada de una estación (navegación y foco de teclado). */
  function irA(e: Estacion) {
    const el = tramo.current;
    if (!el) { document.getElementById(`d-${e}`)?.scrollIntoView(); return; }
    scrollTo({ top: el.getBoundingClientRect().top + scrollY + (ANCLA[e] / ALTO_VH) * (el.offsetHeight - innerHeight), behavior: "auto" });
  }

  const fijo = modo === "fijo";
  const ctx = { fijo, estacion, bus, irA };

  const botonLampara = (
    <button
      type="button" aria-pressed={lampara} onClick={() => setLampara((v) => !v)}
      className={`d-boton mt-5 inline-flex min-h-12 items-center rounded-full border px-7 text-[17px] font-medium ${foco} ${lampara ? "border-[color:var(--hueso)] bg-[color:var(--hueso)] text-[color:var(--noche)]" : "border-[color:var(--hueso)]/16 bg-[color:var(--piedra-alta)] text-[color:var(--hueso)] hover:bg-[color:var(--veta)]"}`}
    >
      {t("lamparaBoton")}
    </button>
  );
  const obj = (n: number) => `d-obj ${fijo || paso >= n ? "ya" : ""}`;

  const portada = (
    <Capa e="portada">
      <En x={1340} y={170} w={480} entra={false}>
        <h1 id="d-t-portada" className={h2} style={{ fontSize: letra(80, 40), lineHeight: 0.96 }}>{t.raw("h1")[0]}<br />{t.raw("h1")[1]}</h1>
        <p className={`${cuerpo} mt-[calc(34*var(--s,1px))] max-w-[24ch]`} style={{ fontSize: letra(24, 17), lineHeight: 1.42 }}>{t("portada")}</p>
        <p className="mt-[calc(40*var(--s,1px))] flex flex-wrap gap-3">
          <a href="#instala" className={`d-boton inline-flex min-h-12 items-center rounded-full border border-[color:var(--hueso)] bg-[color:var(--hueso)] px-7 text-[17px] font-medium text-[color:var(--noche)] hover:bg-white ${foco}`}>{t("instalalo")}</a>
          <Link href="/fogar-tv" className={`d-boton inline-flex min-h-12 items-center rounded-full border border-[color:var(--hueso)]/16 bg-[color:var(--piedra-alta)] px-7 text-[17px] font-medium text-[color:var(--hueso)] hover:bg-[color:var(--veta)] ${foco}`}>{t("verTv")}</Link>
        </p>
      </En>
      <p className="sr-only">{t("recorrido")} {t("teleSr")}</p>
    </Capa>
  );
  const gateway = (
    <Capa e="gateway">
      <En x={180} y={150} w={470}>
        <h2 id="d-t-gateway" className={h2} style={{ fontSize: letra(56, 26) }}>{t.raw("gatewayH2")[0]}{" "}<br className="max-md:hidden" />{t.raw("gatewayH2")[1]}</h2>
        <p className={`${cuerpo} mt-[calc(28*var(--s,1px))]`} style={{ fontSize: letra(24, 17), lineHeight: 1.42 }}>{t("gateway")}</p>
      </En>
    </Capa>
  );
  const voz = (
    <Capa e="voz">
      <En x={180} y={110} w={800}>
        <h2 id="d-t-voz" className={h2} style={{ fontSize: letra(56, 26) }}>{t.raw("vozH2")[0]}{" "}<br className="max-md:hidden" />{t.raw("vozH2")[1]}</h2>
      </En>
      <En x={180} y={262} w={340} i={1}>
        <p className={cuerpo} style={{ fontSize: letra(24, 17), lineHeight: 1.42 }}>{t("voz")}</p>
      </En>
      <En x={890} y={300} w={290} i={3}>
        <p className={cuerpo} style={{ fontSize: letra(24, 17), lineHeight: 1.42 }}>{t("vozEjemplo")}</p>
      </En>
    </Capa>
  );
  const balda = (
    <Capa e="balda">
      <En x={180} y={96} w={800} i={0}>
        <h2 id="d-t-balda" className={h2} style={{ fontSize: letra(56, 24) }}>{t.raw("baldaH2")[0]}{" "}<br className="max-md:hidden" />{t.raw("baldaH2")[1]}</h2>
      </En>
      <ul className={fijo ? "mt-8 flex flex-col gap-8" : "contents"}>
        <li className={fijo ? "" : "contents"}>
          <En x={420} y={700} w={330} entra={false} className={obj(1)}>
            <p className={cuerpo} style={{ fontSize: letra(22, 16), lineHeight: 1.42 }}><strong className="font-semibold">{t("lamparaTitulo")}</strong> <span className="opacity-80">{t("lampara")}</span></p>
            {botonLampara}
          </En>
        </li>
        <li className={fijo ? "" : "contents"}>
          <En x={1040} y={188} entra={false} className={obj(2)}>
            <p className="font-light tabular-nums leading-none tracking-[-0.02em] text-[color:var(--hueso)]" style={{ fontSize: letra(64, 32) }} aria-label={t("temperatura", { n: TEMPERATURA })}>{TEMPERATURA}°</p>
          </En>
        </li>
        <li className={fijo ? "" : "contents"}>
          <En x={858} y={700} w={320} entra={false} className={obj(3)}>
            <p className={cuerpo} style={{ fontSize: letra(22, 16), lineHeight: 1.42 }}>{t("radio")}</p>
          </En>
        </li>
        <li className={fijo ? "" : "contents"}>
          <En x={1287} y={700} w={300} entra={false} className={obj(4)}>
            <p className={cuerpo} style={{ fontSize: letra(22, 16), lineHeight: 1.42 }}>{t("libreta")}</p>
          </En>
        </li>
      </ul>
      {/* La propia lámpara también se puede pulsar; el control con nombre es el botón. */}
      {!fijo && <Anclado x={495} y={278}><div aria-hidden className="d-zona cursor-pointer" style={{ width: "calc(195 * var(--s))", height: "calc(330 * var(--s))" }} onClick={() => setLampara((v) => !v)} /></Anclado>}
    </Capa>
  );
  const lista = "flex flex-col gap-[calc(14*var(--s,1px))]";
  const enlace = `underline decoration-[color:var(--hueso)]/50 underline-offset-4 hover:decoration-[color:var(--hueso)] ${foco}`;
  const pared = (
    <Capa e="pared">
      <En x={180} y={120} w={760}>
        <h2 id="d-t-pared" className={`${h2} md:whitespace-nowrap`} style={{ fontSize: letra(56, 26) }}>{t("paredH2")}</h2>
        <p className={`${cuerpo} mt-[calc(24*var(--s,1px))] max-w-[calc(520*var(--s,1px))]`} style={{ fontSize: letra(22, 17), lineHeight: 1.42 }}>{t("gateway2")}</p>
      </En>
      <En x={180} y={330} w={360} i={1}>
        <ul aria-label={t("clientesLabel")} className={`${lista} ${cuerpo}`} style={{ fontSize: letra(24, 17), lineHeight: 1.25 }}>
          {(t.raw("clientes") as string[]).map((c) => <li key={c}>{c}</li>)}
          <li><a className={enlace} href={PROTOCOLO}>+ {t("tuCliente")}</a></li>
        </ul>
      </En>
      {!fijo && <Anclado x={180} y={506}><div aria-hidden className="d-guia" style={{ height: "calc(42 * var(--s))" }} /></Anclado>}
      {!fijo && <Anclado x={1110} y={506}><div aria-hidden className="d-guia" style={{ height: "calc(42 * var(--s))" }} /></Anclado>}
      <En x={760} y={440} w={400} i={2} className="text-center">
        <p className="font-display tracking-[-0.035em] text-[color:var(--hueso)]" style={{ fontSize: letra(56, 26), lineHeight: 1 }}>Gateway</p>
      </En>
      <En x={800} y={584} w={320} i={2} className="text-center">
        <p className={cuerpo} style={{ fontSize: letra(22, 17) }}>OpenClaw</p>
      </En>
      <En x={1110} y={330} w={440} i={3}>
        <p className="mb-[calc(14*var(--s,1px))] font-semibold text-[color:var(--hueso)]" style={{ fontSize: letra(22, 16) }}>MCP</p>
        <ul aria-label={t("herramientasLabel")} className={`${lista} ${cuerpo}`} style={{ fontSize: letra(24, 17), lineHeight: 1.25 }}>
          {(t.raw("herramientas") as [string, string][]).map(([a, b]) => <li key={a}>{a} <span className="opacity-80">· {b}</span></li>)}
          <li><a className={enlace} href={GITHUB_ORG}>+ {t("tuHerramienta")}</a></li>
        </ul>
      </En>
      <En x={180} y={860} w={700} i={4}>
        <p className={cuerpo} style={{ fontSize: letra(18, 16), lineHeight: 1.5 }}>{t("nota")}</p>
      </En>
    </Capa>
  );
  const cierre = (
    <Capa e="cierre">
      {/* La línea vuelve a escribir «Fogar»; lo que sigue (instalar, privacidad, puertas y pie) va debajo del recorrido. */}
      <p id="d-t-cierre" className="sr-only">Fogar</p>
    </Capa>
  );

  if (!modo) return <div className="min-h-screen bg-[color:var(--noche)]" />;

  if (fijo)
    return (
      <DCtx.Provider value={ctx}><div className="d-fijo bg-[color:var(--noche)] pb-24">
        <style>{CSS}</style>
        {([["portada", portada], ["gateway", gateway], ["voz", voz], ["balda", balda], ["pared", pared]] as const).map(([e, contenido]) => (
          <section key={e} id={`d-${e}`} aria-labelledby={`d-t-${e}`} className="mx-auto max-w-[1100px]">
            <div className="relative">
              {e !== "pared" && <img src={img(FIJA[e])} alt="" className="block aspect-[4/5] w-full object-cover md:aspect-video" style={{ objectPosition: ENCUADRE[e] }} fetchPriority={e === "portada" ? "high" : "auto"} loading={e === "portada" ? "eager" : "lazy"} />}
              {e === "portada" && <TeleFija textos={textosTele} />}
              {e === "balda" && <img src="/lab/secuencia/v6/1280/balda_lampara.webp" alt="" aria-hidden style={{ objectPosition: ENCUADRE.balda }} className={`d-luz absolute inset-0 h-full w-full object-cover ${lampara ? "on opacity-100" : "opacity-0"}`} />}
            </div>
            <div className="flex flex-col gap-5 px-4 pb-16 pt-8 md:px-8" style={{ "--s": "0.5px" } as CSSProperties}>
              {e === "portada" && <div className="w-40"><LineaViva tinta={TINTA} quieta label={t("lineaLabel")} /></div>}
              {contenido}
            </div>
          </section>
        ))}
      </div></DCtx.Provider>
    );

  return (
    <DCtx.Provider value={ctx}><div>
      <style>{CSS}</style>
      <a href="#instala" className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[color:var(--hueso)] focus:px-5 focus:py-3 focus:text-[color:var(--noche)]`}>{t("saltar")}</a>
      <div ref={tramo} id="seq-scroll" className="relative bg-[color:var(--noche)]" style={{ height: `${ALTO_VH}vh` }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden [container-type:size]" data-gl={gl ? "1" : undefined}>
          <img src={img(0, ancho)} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
          <ScrollSequence scrollId="seq-scroll" count={N} src={src} onPaint={onPaint} mapa={fotogramaDe} />
          <canvas ref={lienzo} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700" />
          <img src={`/lab/secuencia/v6/${ancho}/balda_lampara.webp`} alt="" aria-hidden loading="lazy" className={`d-luz pointer-events-none absolute inset-0 h-full w-full object-cover ${lampara && estacion === "balda" ? "on opacity-100" : "opacity-0"}`} />
          <div className="absolute top-3 z-10" style={{ left: "max(8px, calc(50% + (180 - 960) * max(100cqw / 1920, 100cqh / 1080) - 16px))" }}>
            <button type="button" aria-pressed={pausa} onClick={() => setPausa((v) => !v)} className={`d-boton min-h-11 rounded-full px-4 text-[14px] font-medium text-[color:var(--hueso)] opacity-70 hover:opacity-100 focus-visible:opacity-100 ${foco} ${pausa ? "bg-[color:var(--noche)] opacity-100" : ""}`}>
              {t("pausa")}
            </button>
          </div>
          <nav aria-label={t("navLabel")} className="absolute right-0 top-1/2 z-10 -translate-y-1/2 pr-3">
            <ol className="flex flex-col">
              {NAV.map(([e, nombre]) => (
                <li key={e}>
                  <a href={`#d-${e}`} aria-label={nombre} aria-current={estacion === e ? "step" : undefined} onClick={(ev) => { ev.preventDefault(); irA(e); }} className={`group flex h-11 w-11 items-center justify-end rounded-full ${foco}`}>
                    <span className={`block h-px bg-[color:var(--hueso)] transition-[width,opacity] duration-300 ease-out ${estacion === e ? "w-7 opacity-100" : "w-3 opacity-50 group-hover:w-5 group-hover:opacity-100"}`} />
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          {portada}{gateway}{voz}{balda}{pared}{cierre}
        </div>
      </div>
    </div></DCtx.Provider>
  );
}
