"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LineaViva } from "@/components/fogar/linea-viva/LineaViva";
import type { EstadoLinea } from "@/components/fogar/linea-viva/motor";
import { TINTA } from "./tinta";

type Item = { id: string; toc: string };
type Nodo = { n: string; d: string; ahora: string };
type Pieza = "cliente" | "gateway" | "transcripcion" | "orquestador" | "sintesis";

const PIEZAS: Pieza[] = ["cliente", "gateway", "transcripcion", "orquestador", "sintesis"];
/* Qué piezas enciende cada parte del texto. Solo se asigna una pieza donde el texto la nombra; «Por qué está separado
   así», «Dónde corre», «Home Assistant» y «Limitaciones» hablan del conjunto y encienden todas. Siguientes y Móntalo, ninguna. */
const MAPA: Record<string, Pieza[]> = {
  resumen: PIEZAS, recorrido: ["cliente"],
  "paso-1": ["cliente"], "paso-2": ["gateway"], "paso-3": ["transcripcion"], "paso-4": ["orquestador"], "paso-5": ["sintesis", "cliente"],
  cortar: ["cliente", "gateway"], "fogar-voice": ["cliente"], tele: ["cliente"],
  abierto: PIEZAS, "por-que": PIEZAS, casa: PIEZAS, "home-assistant": PIEZAS, limites: PIEZAS,
  siguientes: [], montalo: [],
};
// el recorrido de «Reproducir»: los nodos de Hilo (messages hilo.nodos), con su pieza y el estado de la línea
const RECORRIDO: { p: Pieza[]; e: EstadoLinea }[] = [
  { p: ["cliente"], e: "listen" }, { p: ["gateway"], e: "think" }, { p: ["transcripcion"], e: "think" },
  { p: ["orquestador"], e: "tool" }, { p: ["sintesis"], e: "speak" }, { p: ["cliente"], e: "speak" },
];
const CADENCIA = 1500;

/* Mapa a tamaño fijo (320 × 196 px): el orbe viaja por offset-path en píxeles. Todo pasa por el gateway: cada camino
   empieza en el cruce H (75,98), entre cliente y gateway. */
const CAJA: Record<Pieza, [number, number, number]> = { cliente: [0, 98, 62], gateway: [88, 98, 108], transcripcion: [220, 30, 100], orquestador: [220, 98, 100], sintesis: [220, 166, 100] };
const IDA: Record<Pieza, string> = {
  cliente: "M75 98 H62", gateway: "M75 98 H88",
  transcripcion: "M75 98 H196 C209 98 207 30 220 30", orquestador: "M75 98 H220", sintesis: "M75 98 H196 C209 98 207 166 220 166",
};
const VUELTA: Record<Pieza, string> = {
  cliente: "M62 98 H75", gateway: "M88 98 H75",
  transcripcion: "M220 30 C207 30 209 98 196 98 H75", orquestador: "M220 98 H75", sintesis: "M220 166 C207 166 209 98 196 98 H75",
};
const CABLES = { cg: "M62 98 H88", gt: "M196 98 C209 98 207 30 220 30", go: "M196 98 H220", gs: "M196 98 C209 98 207 166 220 166" };
const cablesDe = (on: Pieza[]) => {
  const c = new Set<string>();
  for (const p of on) {
    if (p === "gateway" || (p === "cliente" && on.length > 1)) c.add("cg");
    if (p === "transcripcion") c.add("cg").add("gt");
    if (p === "orquestador") c.add("cg").add("go");
    if (p === "sintesis") c.add("cg").add("gs");
  }
  return c;
};

/**
 * Artículo con escenario: desde 1024 px, columna sticky con la línea viva, el mapa de las cinco piezas (se encienden con
 * la parte que se lee), «Reproducir el recorrido» y el índice. Por debajo, una tira sticky con la pieza activa.
 */
export function Escenario({ items, children }: { items: Item[]; children: ReactNode }) {
  const t = useTranslations("diy.articulo");
  const nodos = t.raw("hilo.nodos") as Nodo[];
  const nombre: Record<Pieza, string> = { cliente: nodos[0].n, gateway: nodos[1].n, transcripcion: nodos[2].n, orquestador: nodos[3].n, sintesis: nodos[4].n };

  const [actual, setActual] = useState(items[0].id);
  const [clave, setClave] = useState<string>("");
  const [estado, setEstado] = useState<EstadoLinea>("rest");
  const [paso, setPaso] = useState(-1); // reproduciendo: índice en RECORRIDO
  const [fin, setFin] = useState("");
  const orbe = useRef<HTMLSpanElement>(null);
  const antes = useRef<Pieza | null>(null);
  const sync = useRef<() => void>(() => {});
  const para = useRef<() => void>(() => {});

  const on: Pieza[] = paso >= 0 ? RECORRIDO[paso].p : MAPA[clave] ?? [];
  const cables = cablesDe(on);
  const rotulo = paso >= 0 ? nodos[paso] : /^paso-\d$/.test(clave) ? nodos[+clave.slice(5) - 1] : null;

  // lectura: manda la última parte cuyo inicio ha pasado la línea de lectura (40 % de la ventana)
  useEffect(() => {
    const ids = items.map((i) => i.id);
    const partes = [...document.querySelectorAll<HTMLElement>("#texto [id]")].filter((el) => el.id in MAPA);
    const secciones = ids.map((id) => document.getElementById(id)).filter((s): s is HTMLElement => !!s);
    const marcas = [...document.querySelectorAll<HTMLElement>("#texto [data-estado]")];
    const ultima = <T extends HTMLElement>(els: T[], linea: number) => {
      let r: T | undefined;
      for (const el of els) { if (el.getBoundingClientRect().top <= linea) r = el; else break; }
      return r;
    };
    let pendiente = false;
    sync.current = () => {
      pendiente = false;
      const linea = innerHeight * 0.4;
      setActual(ultima(secciones, linea)?.id ?? ids[0]);
      setClave(ultima(partes, linea)?.id ?? "");
      setEstado((ultima(marcas, linea)?.dataset.estado as EstadoLinea | undefined) ?? "rest");
    };
    const pide = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(() => sync.current()); } };
    addEventListener("scroll", pide, { passive: true });
    addEventListener("resize", pide, { passive: true });
    pide();
    return () => { removeEventListener("scroll", pide); removeEventListener("resize", pide); };
  }, [items]);

  // Copiar en «Móntalo» hace hablar a la línea un momento
  useEffect(() => {
    let id: number | undefined;
    const habla = () => { setEstado("speak"); clearTimeout(id); id = window.setTimeout(() => sync.current(), 1800); };
    addEventListener("diy:habla", habla);
    return () => { removeEventListener("diy:habla", habla); clearTimeout(id); };
  }, []);

  // Reproducir: recorre los nodos sin mover la página; se para con el botón, con 60 px de scroll o con la pestaña oculta
  useEffect(() => {
    if (paso < 0) return;
    const id = window.setTimeout(() => (paso + 1 < RECORRIDO.length ? setPaso(paso + 1) : para.current()), CADENCIA);
    return () => clearTimeout(id);
  }, [paso]);

  useEffect(() => {
    if (paso < 0) return;
    const y0 = scrollY;
    const scroll = () => { if (Math.abs(scrollY - y0) > 60) para.current(); };
    const oculta = () => { if (document.hidden) para.current(); };
    addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("visibilitychange", oculta);
    return () => { removeEventListener("scroll", scroll); document.removeEventListener("visibilitychange", oculta); };
  }, [paso >= 0]); // eslint-disable-line react-hooks/exhaustive-deps -- solo al empezar y al parar

  useEffect(() => {
    para.current = () => { setPaso(-1); setFin(t("escenario.fin")); sync.current(); };
  }, [t]);

  // el orbe viaja de la pieza anterior a la nueva por los cables (WAAPI + offset-path); sin soporte o con
  // «reducir movimiento», se queda quieto y oculto
  const destino = on.length === PIEZAS.length ? "gateway" : on[0];
  useEffect(() => {
    const el = orbe.current;
    const de = antes.current;
    antes.current = destino ?? null;
    if (!el || !destino) { el?.removeAttribute("data-visible"); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !CSS.supports("offset-path", "path('M0 0')")) return;
    el.setAttribute("data-visible", "");
    const camino = de && de !== destino ? VUELTA[de] + IDA[destino].slice(7) : IDA[destino];
    el.style.offsetPath = `path('${camino}')`;
    el.animate([{ offsetDistance: "0%" }, { offsetDistance: "100%" }], { duration: de ? 640 : 420, easing: "cubic-bezier(0.77, 0, 0.175, 1)", fill: "forwards" });
  }, [destino]);

  const jugando = paso >= 0;
  const linea: EstadoLinea = jugando ? RECORRIDO[paso].e : estado;
  const voz = jugando ? t("escenario.paso", { n: paso + 1, total: RECORRIDO.length, pieza: nodos[paso].n, ahora: nodos[paso].ahora }) : fin;
  const conPiezas = on.length > 0;

  return (
    <div className="diy-articulo f-ancho pb-24 pt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16 xl:gap-20" data-piezas={conPiezas ? "" : undefined}>
      {/* tira móvil: alto 0 para no empujar el texto; la barra cuelga por encima */}
      <div className="diy-tira lg:hidden" aria-hidden="true">
        <div className="barra">
          <div className="w-[64px] shrink-0"><LineaViva estado={linea} tinta={TINTA} label="" /></div>
          <svg viewBox="0 0 76 26" className="mini" aria-hidden="true">
            <path d="M4 13 H30 C42 13 40 4 52 4 M30 13 H52 M30 13 C42 13 40 22 52 22" className="base" />
            {PIEZAS.map((p, i) => {
              const [x, y] = [[6, 13], [30, 13], [55, 4], [55, 13], [55, 22]][i];
              return <circle key={p} cx={x} cy={y} r={3} data-on={on.includes(p) ? "" : undefined} />;
            })}
          </svg>
          <p className="nombre">{on.length === PIEZAS.length ? items.find((i) => i.id === actual)?.toc : on.map((p) => nombre[p]).join(" · ")}</p>
        </div>
      </div>

      {children}

      <aside className="hidden lg:block">
        <div className="diy-escenario">
          <div className="linea"><LineaViva estado={linea} tinta={TINTA} label="" /></div>

          <div className="mapa" aria-hidden="true">
            <svg width="320" height="196" viewBox="0 0 320 196">
              {Object.entries(CABLES).map(([k, d]) => <path key={k} d={d} className="base" />)}
              {Object.entries(CABLES).map(([k, d]) => <path key={k} d={d} pathLength={1} className="lit" data-on={cables.has(k) ? "" : undefined} />)}
              {PIEZAS.map((p) => {
                const [x, y, w] = CAJA[p];
                return (
                  <g key={p} className="pieza" data-on={on.includes(p) ? "" : undefined}>
                    <rect x={x + 0.5} y={y - 15.5} width={w - 1} height={31} rx={9} />
                    <circle cx={x + 11} cy={y} r={3} />
                    <text x={x + 19} y={y + 4.2}>{nombre[p]}</text>
                  </g>
                );
              })}
            </svg>
            <span ref={orbe} className="orbe" />
          </div>

          <p className="rotulo" aria-hidden="true">
            {rotulo ? <><span className="n">{rotulo.n}</span> <span className="ahora">{rotulo.ahora}</span></> : <span className="ahora">{items.find((i) => i.id === actual)?.toc}</span>}
          </p>

          <button type="button" className="reproducir f-foco" aria-pressed={jugando} onClick={() => (jugando ? para.current() : setPaso(0))}>
            <span className="icono" aria-hidden="true" />{t("escenario.reproducir")}
          </button>
          <p className="sr-only" aria-live="polite">{voz}</p>

          <nav aria-label={t("enEsta")} className="toc">
            <ol>
              {items.map((i) => (
                <li key={i.id}>
                  <a href={`#${i.id}`} aria-current={actual === i.id ? "true" : undefined} className="f-foco">{i.toc}</a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </aside>
    </div>
  );
}
