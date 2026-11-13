"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import NumberFlow from "@number-flow/react";
import { Anclado, Capa } from "@/components/fogar/escena/Escena";
import { useRecorrido, type Estacion } from "./Recorrido";

gsap.registerPlugin(useGSAP, SplitText);

/** Textos de la spec (JLD Spec 2026-11-12) y del laboratorio de la secuencia. No se inventa ninguno. */
export const T = {
  h1: ["El fuego", "de tu casa"],
  frasePortada: "Una pantalla o un altavoz compatibles pueden ser clientes.",
  rotulosPortada: [
    { t: "Fogar TV", x: 720, y: 516 },
    { t: "altavoz", x: 352, y: 486 },
    { t: "móvil", x: 1550, y: 588 },
  ],
  h2Voz: "Escucha tras su palabra de activación.",
  fraseVoz: "La que tú elijas. Hasta oírla, el audio no sale del aparato. Es un cliente más.",
  ejemploVoz: "p. ej. “¿Qué tengo pendiente esta semana?”",
  rotuloVoz: "cliente de voz",
  casa: "La casa. Fogar enciende la lámpara a través de Home Assistant.",
  lampara: "Lámpara",
  radio: "Un altavoz conectado a un cliente ligero: basta un ESP32.",
  libreta: "Tu segundo cerebro, donde ya escribes.",
  h2Balda: "Fogar no trae su suite. Usa la tuya.",
  temperatura: 21,
};

/** Coordenadas de escena (1920×1080) medidas sobre f_000, f_096 y f_187. */
export const SITIO = {
  tele: [693, 270, 1226, 570],
  altavozVoz: [608, 443, 833, 675],
  lampara: [495, 275, 690, 608],
  pantallaLampara: [590, 300],
  radio: [850, 450, 1105, 603],
  reloj: [1210, 550],
  libreta: [1287, 573, 1470, 608],
  termometro: [966, 220],
} as const;

export const letra = (px: number, min = 14) => `max(${min}px, calc(${px} * var(--s, 1px)))`;

/** En el modo escena coloca en coordenadas de escena; en el apilado, fluye como un bloque normal. */
export function Pos({ x, y, w, children, className = "", style }: { x: number; y: number; w?: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  const { modo } = useRecorrido();
  if (modo === "apilado") return <div className={`relative ${className}`} style={style}>{children}</div>;
  return <Anclado x={x} y={y} w={w} className={className}>{style ? <div style={style}>{children}</div> : children}</Anclado>;
}

/**
 * Timeline de entrada por estación: se construye pausada y avanza al llegar a la estación y retrocede al salir.
 * Con el modo apilado (móvil y «reducir movimiento») queda en su estado final: se ve el contenido sin el viaje.
 */
export function useEntrada(scope: RefObject<HTMLElement | null>, e: Estacion, build: (tl: gsap.core.Timeline, q: (s: string) => Element[]) => void) {
  const { estacion, modo } = useRecorrido();
  const tl = useRef<gsap.core.Timeline | null>(null);
  const activa = useRef(false);
  useEffect(() => { activa.current = estacion === e; });
  useGSAP(
    () => {
      const t = gsap.timeline({ paused: true, defaults: { ease: "expo.out", duration: 1.1 } });
      build(t, gsap.utils.selector(scope));
      tl.current = t;
      if (modo === "apilado") t.progress(1);
      // Si la timeline se rehace (modo estricto, recarga en caliente) con la estación ya activa, arranca aquí:
      // el efecto de abajo no vuelve a correr porque sus dependencias no han cambiado.
      else if (activa.current) t.play();
    },
    { scope, dependencies: [modo] },
  );
  useEffect(() => {
    const t = tl.current;
    if (!t || modo === "apilado") return;
    if (estacion === e) t.timeScale(1).play();
    else t.timeScale(2.4).reverse(); // la salida, más corta que la entrada
  }, [estacion, e, modo]);
  return estacion === e || modo === "apilado";
}

/** Rótulos que siguen un poco al ratón (profundidad de capa): cada uno con su `data-prof` (px de viaje). */
export function useProfundidad(scope: RefObject<HTMLElement | null>) {
  const { modo, bus } = useRecorrido();
  useGSAP(
    () => {
      if (modo === "apilado") return;
      const els = gsap.utils.toArray<HTMLElement>("[data-prof]", scope.current);
      const qs = els.map((el) => ({
        p: Number(el.dataset.prof),
        x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3" }),
        y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3" }),
      }));
      const tick = () => {
        const [mx, my] = bus.mouse;
        for (const q of qs) { q.x((mx - 0.5) * q.p); q.y((my - 0.5) * q.p); }
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { scope, dependencies: [modo] },
  );
}

/** La capa de luz de la lámpara (WebP con transparencia), con las curvas de la spec: 120 ms al encender, 300 ms al apagar. */
export function LuzLampara({ on }: { on: boolean }) {
  const { estacion, modo, ancho } = useRecorrido();
  if (modo === "apilado") return null;
  const visible = estacion === "balda" && on;
  return (
    <img
      src={`/lab/secuencia/v6/${ancho}/balda_lampara.webp`}
      alt=""
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      style={{ opacity: visible ? 1 : 0, transition: `opacity ${on ? 120 : 300}ms cubic-bezier(0.23, 1, 0.32, 1)` }}
    />
  );
}

/** La lectura del termómetro con cifras que fluyen: entra rodando desde 0 al llegar a la balda. */
export function Temperatura({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const { estacion, modo } = useRecorrido();
  const [v, setV] = useState(modo === "apilado" ? T.temperatura : 0);
  useEffect(() => {
    if (modo === "apilado") return;
    const id = setTimeout(() => setV(estacion === "balda" ? T.temperatura : 0), estacion === "balda" ? 450 : 0);
    return () => clearTimeout(id);
  }, [estacion, modo]);
  return (
    <span className={className} style={style} aria-label={`Temperatura: ${T.temperatura} grados`} role="img">
      <NumberFlow value={v} suffix="°" aria-hidden transformTiming={{ duration: 900, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }} spinTiming={{ duration: 1100, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }} />
    </span>
  );
}

/** Ciclo de la línea viva en la voz: una pasada escucha → piensa → habla y vuelve a reposo (spec §1.5). */
export function usePasadaVoz() {
  const { estacion, modo } = useRecorrido();
  const [estado, setEstado] = useState<"rest" | "listen" | "think" | "speak">("rest");
  useEffect(() => {
    const pasos: [number, "listen" | "think" | "speak" | "rest"][] =
      modo === "apilado" || estacion !== "voz" ? [[0, "rest"]] : [[500, "listen"], [3300, "think"], [6100, "speak"], [9800, "rest"]];
    const ids = pasos.map(([ms, st]) => setTimeout(() => setEstado(st), ms));
    return () => ids.forEach(clearTimeout);
  }, [estacion, modo]);
  return estado;
}

/** Contenedor de una estación: capa a pantalla completa en el modo escena, bloque normal en el apilado. */
export function Marco({ e, children, refEl, className = "" }: { e: Estacion; children: ReactNode; refEl?: RefObject<HTMLDivElement | null>; className?: string }) {
  const { modo, estacion } = useRecorrido();
  if (modo === "apilado")
    return <div ref={refEl} className={`flex flex-col gap-6 ${className}`} style={{ "--s": "0.55px" } as CSSProperties}>{children}</div>;
  return <div ref={refEl}><Capa visible={estacion === e} className={className}>{children}</Capa></div>;
}

/** Botón de un estado de la casa: tamaño táctil de 44 px, `aria-pressed` y nombre fijo (nunca un verbo). */
export const focoVisible = "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[color:var(--hueso)]";
