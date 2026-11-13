"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ScrollSequence from "@/components/fogar/ScrollSequence";
import { pinta, type Bus } from "./bus";

/*
 * Base común de las tres direcciones del laboratorio: el recorrido de 283 fotogramas, el «bus» con el fotograma
 * pintado (la UI se mueve con lo que se ve, no con el scroll) y el modo apilado para móvil y «reducir movimiento».
 * La capa WebGL de cada dirección se importa después de `load` y en un momento ocioso: el HTML llega primero.
 */

export const N = 283;
const ALTO_VH = 1400;

export type Estacion = "portada" | "gateway" | "voz" | "balda";
/** Fotogramas en los que cada estación tiene su texto (paradas del v6, con unos fotogramas de llegada; spec §1.1). */
export const ESTACIONES: Record<Estacion, [number, number]> = { portada: [0, 18], gateway: [25, 81], voz: [88, 104], balda: [174, 199] };
/** Imagen fija de cada estación en el modo apilado (spec §4.1). */
const FIJA: Record<Estacion, number> = { portada: 0, gateway: 60, voz: 96, balda: 187 };
const TRES: Estacion[] = ["portada", "voz", "balda"];

type Ctx = { bus: Bus; estacion: Estacion | null; modo: "escena" | "apilado"; ancho: number };
const RecorridoCtx = createContext<Ctx | null>(null);
export const useRecorrido = () => useContext(RecorridoCtx)!;

type Props = {
  /** Lo que va encima del vídeo en el modo escena (capas por estación). */
  escena: ReactNode;
  /** El contenido de cada estación bajo su imagen fija, en el modo apilado. */
  apilado: (e: Estacion) => ReactNode;
  /** Capa WebGL de la dirección: se carga tarde y recibe el lienzo, la fuente (canvas 2D del vídeo) y el bus. */
  gl?: () => Promise<{ default: (lienzo: HTMLCanvasElement, bus: Bus) => () => void }>;
  /** Clase del fondo del modo apilado. */
  fondoApilado?: string;
  /** Estaciones que usa la dirección, en orden. */
  estaciones?: Estacion[];
};

function modoInicial(): "escena" | "apilado" {
  const q = new URLSearchParams(location.search);
  if (q.has("fijo")) return "apilado";
  return matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px), (pointer: coarse)").matches ? "apilado" : "escena";
}

export function Recorrido({ escena, apilado, gl, fondoApilado = "", estaciones = TRES }: Props) {
  const ORDEN = estaciones;
  const estacionDe = (f: number): Estacion | null => ORDEN.find((e) => f >= ESTACIONES[e][0] && f <= ESTACIONES[e][1]) ?? null;
  const [bus] = useState<Bus>(() => ({ frame: 0, canvas: null, dirty: false, mouse: [0.5, 0.5], estacion: null }));
  const [modo, setModo] = useState<"escena" | "apilado" | null>(null);
  const [ancho, setAncho] = useState(1280);
  const [estacion, setEstacion] = useState<Estacion | null>("portada");
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el modo y el ancho dependen de la pantalla: solo se saben en el navegador
    setModo(modoInicial());
    setAncho(innerWidth * Math.min(devicePixelRatio, 2) > 1600 ? 1920 : 1280);
    const mueve = (e: PointerEvent) => { bus.mouse = [e.clientX / innerWidth, e.clientY / innerHeight]; };
    addEventListener("pointermove", mueve, { passive: true });
    return () => removeEventListener("pointermove", mueve);
  }, [bus]);

  // La capa WebGL: después de `load` y en un hueco ocioso, y solo en el modo escena.
  useEffect(() => {
    if (modo !== "escena" || !gl || !lienzo.current) return;
    let quitar: (() => void) | undefined, vivo = true;
    const arranca = () =>
      gl().then(
        (m) => {
          const l = lienzo.current;
          if (!vivo || !l) return;
          quitar = m.default(l, bus);
          l.parentElement!.dataset.gl = "1"; // la CSS puede quitar sus sustitutos (vidrio en CSS, etc.)
        },
        (e) => console.warn("Sin capa WebGL:", e),
      );
    const ocioso = () => ("requestIdleCallback" in window ? requestIdleCallback(arranca, { timeout: 1200 }) : setTimeout(arranca, 200));
    if (document.readyState === "complete") ocioso(); else addEventListener("load", ocioso, { once: true });
    const l = lienzo.current;
    return () => { vivo = false; quitar?.(); delete l.parentElement?.dataset.gl; };
  }, [modo, gl, bus]);

  const src = useMemo(() => (i: number) => `/lab/secuencia/v6/${ancho}/f_${String(i).padStart(3, "0")}.avif`, [ancho]);
  const onPaint = useMemo(
    () => (i: number, canvas: HTMLCanvasElement) => {
      const e = estacionDe(i);
      if (pinta(bus, i, canvas, e)) setEstacion(e); // React solo cambia al cambiar de estación
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `estaciones` es fija por dirección
    [bus],
  );

  if (!modo) return <div className="min-h-screen bg-[color:var(--noche)]" />;
  const ctx: Ctx = { bus, estacion, modo, ancho };

  if (modo === "apilado")
    return (
      <RecorridoCtx.Provider value={ctx}>
        <main className={`bg-[color:var(--noche)] pb-24 ${fondoApilado}`}>
          {ORDEN.map((e) => (
            <section key={e} aria-label={e} className="mx-auto max-w-[1100px]">
              <img
                src={`/lab/secuencia/v6/1280/f_${String(FIJA[e]).padStart(3, "0")}.avif`}
                alt=""
                className="block aspect-video w-full object-cover"
                fetchPriority={e === "portada" ? "high" : "auto"}
                loading={e === "portada" ? "eager" : "lazy"}
              />
              <div className="px-4 pb-16 pt-8 md:px-8">{apilado(e)}</div>
            </section>
          ))}
        </main>
      </RecorridoCtx.Provider>
    );

  return (
    <RecorridoCtx.Provider value={ctx}>
      <div id="seq-scroll" className="relative bg-[color:var(--noche)]" style={{ height: `${ALTO_VH}vh` }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden [container-type:size]">
          <ScrollSequence scrollId="seq-scroll" count={N} src={src} onPaint={onPaint} />
          <canvas ref={lienzo} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" />
          {escena}
        </div>
      </div>
    </RecorridoCtx.Provider>
  );
}

/** Elemento visible solo en su estación (o siempre en el modo apilado). Fundido corto; dentro de la parada, al 100 %. */
export function EnEstacion({ e, children }: { e: Estacion; children: ReactNode }) {
  const { estacion, modo } = useRecorrido();
  if (modo === "apilado") return <>{children}</>;
  return children && estacion === e ? <>{children}</> : null;
}
