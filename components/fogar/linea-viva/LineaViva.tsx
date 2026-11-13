"use client";

import { useEffect, useRef } from "react";
import type { EstadoLinea, crearLineaViva as Crear } from "./motor";

type Tinta = NonNullable<Parameters<typeof Crear>[1]>;

type Props = {
  estado?: EstadoLinea;
  className?: string;
  /** Texto para lectores de pantalla; la línea escribe «Fogar». */
  label?: string;
  /** Paleta, halo y humo; se leen al montar. */
  tinta?: Omit<Tinta, "reduce">;
  /** Fuerza la versión fija (pose quieta), como con «reducir movimiento». Se lee al montar. */
  quieta?: boolean;
};

/** La línea viva de Fogar: una sola línea que escribe «Fogar» y cambia de forma con el estado. Proporción 1000:420. */
export function LineaViva({ estado = "rest", className = "", label = "Fogar", tinta, quieta = false }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const motor = useRef<ReturnType<typeof import("./motor").crearLineaViva> | null>(null);
  const pendiente = useRef(estado);
  const tintaRef = useRef(tinta);
  const quietaRef = useRef(quieta);

  useEffect(() => {
    let vivo = true;
    const reduce = quietaRef.current || matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("./motor").then(({ crearLineaViva }) => {
      if (!vivo || !ref.current) return;
      motor.current = crearLineaViva(ref.current, { ...tintaRef.current, reduce });
      if (pendiente.current !== "rest") motor.current.set(pendiente.current);
    });
    // Repinta si cambia el tamaño del contenedor o el devicePixelRatio (zoom, otra pantalla); la consulta de DPR se rehace tras cada cambio.
    const onResize = () => motor.current?.resize();
    const ro = new ResizeObserver(onResize);
    if (ref.current) ro.observe(ref.current);
    let mq: MediaQueryList | null = null;
    const onDpr = () => { mq?.removeEventListener("change", onDpr); onResize(); if (!vivo) return; mq = matchMedia(`(resolution: ${devicePixelRatio}dppx)`); mq.addEventListener("change", onDpr); };
    mq = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    mq.addEventListener("change", onDpr);
    return () => {
      vivo = false;
      ro.disconnect();
      mq?.removeEventListener("change", onDpr);
      motor.current?.destroy();
      motor.current = null;
    };
  }, []);

  useEffect(() => {
    pendiente.current = estado; // por si el motor aún no ha cargado
    motor.current?.set(estado);
  }, [estado]);

  // El lienzo se sale 70 unidades por lado (PAD en motor.js) para que el halo no se corte: 1140×560 sobre la caja 1000×420.
  return (
    <div className={`relative aspect-[1000/420] w-full ${className}`}>
      <canvas ref={ref} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })} className="pointer-events-none absolute left-[-7%] top-[-16.6667%] block h-[133.3333%] w-[114%] max-w-none" />
    </div>
  );
}
